import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterCarDto, UpdateCarDto } from './dto';

@Injectable()
export class UserCarsService {
  constructor(private prisma: PrismaService) {}

  // ─── REGISTER CAR ─────────────────────────────────────────────

  async registerCar(userId: string, dto: RegisterCarDto) {
    // Check duplicate registration number
    const existing = await this.prisma.userCar.findUnique({
      where: { registrationNumber: dto.registrationNumber },
    });

    if (existing) {
      throw new ConflictException(
        'A car with this registration number already exists',
      );
    }

    // Fetch catalog entry to get car details
    const catalog = await this.prisma.carCatalog.findUnique({
      where: { id: dto.catalogId },
    });

    if (!catalog) {
      throw new NotFoundException(
        'Car model not found in catalog. Only cars in the catalog can be registered.',
      );
    }

    // Create user car linked to catalog
    const car = await this.prisma.userCar.create({
      data: {
        userId,
        catalogId: dto.catalogId,
        registrationNumber: dto.registrationNumber,
        vinNumber: dto.vinNumber,
        manufacturer: catalog.manufacturer,
        modelName: catalog.modelName,
        year: catalog.year,
        variant: catalog.variant,
        color: dto.color,
        mileage: dto.mileage,
        condition: dto.condition || 'USED',
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchasePrice: dto.purchasePrice,
      },
      include: {
        catalog: {
          select: {
            bodyType: true,
            fuelType: true,
            transmission: true,
            engineCapacity: true,
            seatingCapacity: true,
            basePrice: true,
            features: true,
          },
        },
      },
    });

    return car;
  }

  // ─── GET USER'S CARS ──────────────────────────────────────────

  async findAllByUser(userId: string) {
    return this.prisma.userCar.findMany({
      where: { userId, isActive: true },
      include: {
        catalog: {
          select: {
            bodyType: true,
            fuelType: true,
            transmission: true,
            engineCapacity: true,
            basePrice: true,
          },
        },
        images: {
          where: { isCurrent: true },
          orderBy: { uploadedAt: 'desc' },
        },
        _count: {
          select: {
            listings: { where: { listingStatus: 'ACTIVE' } },
            rentals: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  // ─── GET SINGLE CAR ──────────────────────────────────────────

  async findOne(carId: string, userId?: string) {
    const car = await this.prisma.userCar.findUnique({
      where: { id: carId },
      include: {
        catalog: true,
        images: {
          orderBy: [{ imageCategory: 'asc' }, { version: 'desc' }],
        },
        listings: {
          where: { listingStatus: 'ACTIVE' },
        },
        _count: { select: { rentals: true } },
      },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // If userId provided, verify ownership
    if (userId && car.userId !== userId) {
      throw new ForbiddenException('You do not own this car');
    }

    return car;
  }

  // ─── UPDATE CAR ───────────────────────────────────────────────

  async update(carId: string, userId: string, dto: UpdateCarDto) {
    const car = await this.findOne(carId, userId);

    return this.prisma.userCar.update({
      where: { id: carId },
      data: dto,
    });
  }

  // ─── DELETE CAR ───────────────────────────────────────────────

  async remove(carId: string, userId: string) {
    const car = await this.prisma.userCar.findUnique({
      where: { id: carId },
      include: {
        listings: { where: { listingStatus: 'ACTIVE' } },
        rentals: { where: { status: 'ACTIVE' } },
      },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    if (car.userId !== userId) {
      throw new ForbiddenException('You do not own this car');
    }

    if (car.listings.length > 0) {
      throw new BadRequestException(
        'Cannot delete a car with active listings. Please close the listing first.',
      );
    }

    if (car.rentals.length > 0) {
      throw new BadRequestException(
        'Cannot delete a car with active rentals.',
      );
    }

    // Soft delete
    return this.prisma.userCar.update({
      where: { id: carId },
      data: { isActive: false },
    });
  }

  // ─── CHECK REGISTRATION IMAGES EXIST ──────────────────────────

  async hasRegistrationImages(carId: string): Promise<boolean> {
    const count = await this.prisma.carImage.count({
      where: {
        carId,
        isPermanent: true,
        imageCategory: {
          in: [
            'REGISTRATION_FRONT',
            'REGISTRATION_BACK',
            'REGISTRATION_LEFT',
            'REGISTRATION_RIGHT',
          ],
        },
      },
    });

    return count === 4;
  }
}
