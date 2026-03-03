import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, RentalStatus } from '@prisma/client';
import {
  CreateRentalDto,
  CompleteRentalDto,
  UpdateRentalStatusDto,
  RentalFilterDto,
} from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RentalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new rental record (CAR_RENTAL accounts only)
   */
  async create(userId: string, dto: CreateRentalDto) {
    // Verify user is a CAR_RENTAL business
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.accountType !== AccountType.CAR_RENTAL) {
      throw new ForbiddenException('Only car rental businesses can create rentals');
    }

    // Verify the car belongs to this user
    const car = await this.prisma.userCar.findFirst({
      where: { id: dto.carId, userId, isActive: true },
    });
    if (!car) {
      throw new NotFoundException('Car not found or does not belong to you');
    }

    // Check no active rental for this car
    const activeRental = await this.prisma.rental.findFirst({
      where: { carId: dto.carId, status: RentalStatus.ACTIVE },
    });
    if (activeRental) {
      throw new BadRequestException('This car already has an active rental');
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Get current periodic image version for pre-inspection
    const latestImage = await this.prisma.carImage.findFirst({
      where: { carId: dto.carId, isCurrent: true },
      orderBy: { version: 'desc' },
    });

    const rental = await this.prisma.rental.create({
      data: {
        carId: dto.carId,
        userId,
        renterName: dto.renterName,
        renterPhone: dto.renterPhone,
        renterEmail: dto.renterEmail,
        renterCnic: dto.renterCnic,
        startDate,
        endDate,
        mileageAtStart: dto.mileageAtStart,
        preRentalNotes: dto.preRentalNotes,
        rentalPrice: dto.rentalPrice,
        preInspectionVersion: latestImage?.version || null,
      },
      include: {
        car: {
          select: {
            registrationNumber: true,
            manufacturer: true,
            modelName: true,
            year: true,
          },
        },
      },
    });

    return rental;
  }

  /**
   * Get all rentals for a business user with filters
   */
  async findAll(userId: string, filters: RentalFilterDto) {
    const { status, carId, fromDate, toDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;
    if (carId) where.carId = carId;
    if (fromDate || toDate) {
      where.startDate = {};
      if (fromDate) where.startDate.gte = new Date(fromDate);
      if (toDate) where.startDate.lte = new Date(toDate);
    }

    const [rentals, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          car: {
            select: {
              registrationNumber: true,
              manufacturer: true,
              modelName: true,
              year: true,
              color: true,
            },
          },
        },
      }),
      this.prisma.rental.count({ where }),
    ]);

    return {
      data: rentals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single rental by ID
   */
  async findOne(id: string, userId: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { id, userId },
      include: {
        car: {
          select: {
            id: true,
            registrationNumber: true,
            manufacturer: true,
            modelName: true,
            year: true,
            color: true,
            mileage: true,
          },
        },
      },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    return rental;
  }

  /**
   * Complete a rental (return the car)
   */
  async completeRental(id: string, userId: string, dto: CompleteRentalDto) {
    const rental = await this.prisma.rental.findFirst({
      where: { id, userId },
      include: { car: true },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new BadRequestException('Only active rentals can be completed');
    }

    // Get current periodic image version for post-inspection
    const latestImage = await this.prisma.carImage.findFirst({
      where: { carId: rental.carId, isCurrent: true },
      orderBy: { version: 'desc' },
    });

    const totalCharges =
      dto.totalCharges ??
      Number(rental.rentalPrice) + (dto.damageCharges || 0);

    const updated = await this.prisma.rental.update({
      where: { id },
      data: {
        status: RentalStatus.COMPLETED,
        actualReturnDate: new Date(),
        mileageAtEnd: dto.mileageAtEnd,
        postRentalNotes: dto.postRentalNotes,
        damageCharges: dto.damageCharges,
        damageDescription: dto.damageDescription,
        totalCharges,
        postInspectionVersion: latestImage?.version || null,
      },
      include: {
        car: {
          select: {
            registrationNumber: true,
            manufacturer: true,
            modelName: true,
          },
        },
      },
    });

    // Send notification
    await this.notificationsService.create(userId, {
      title: 'Rental Completed',
      message: `Rental for ${updated.car.manufacturer} ${updated.car.modelName} (${updated.car.registrationNumber}) has been completed.`,
      type: 'SUCCESS',
    });

    return updated;
  }

  /**
   * Cancel a rental
   */
  async cancelRental(id: string, userId: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { id, userId },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new BadRequestException('Only active rentals can be cancelled');
    }

    return this.prisma.rental.update({
      where: { id },
      data: { status: RentalStatus.CANCELLED },
    });
  }

  /**
   * Dashboard stats for car rental businesses
   */
  async getBusinessStats(userId: string) {
    const [active, completed, totalRevenue, totalRentals] = await Promise.all([
      this.prisma.rental.count({ where: { userId, status: RentalStatus.ACTIVE } }),
      this.prisma.rental.count({ where: { userId, status: RentalStatus.COMPLETED } }),
      this.prisma.rental.aggregate({
        where: { userId, status: RentalStatus.COMPLETED },
        _sum: { totalCharges: true },
      }),
      this.prisma.rental.count({ where: { userId } }),
    ]);

    return {
      activeRentals: active,
      completedRentals: completed,
      totalRentals,
      totalRevenue: totalRevenue._sum.totalCharges || 0,
    };
  }
}
