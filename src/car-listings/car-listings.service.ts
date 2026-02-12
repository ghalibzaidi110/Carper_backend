import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  CreateListingDto,
  UpdateListingDto,
  UpdateListingStatusDto,
  ListingFilterDto,
  ContactSellerDto,
} from './dto';

@Injectable()
export class CarListingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ─── CREATE LISTING ───────────────────────────────────────────

  async create(userId: string, dto: CreateListingDto) {
    // Verify car ownership
    const car = await this.prisma.userCar.findUnique({
      where: { id: dto.carId },
      include: {
        images: {
          where: { isPermanent: true },
        },
      },
    });

    if (!car) throw new NotFoundException('Car not found');
    if (car.userId !== userId) throw new ForbiddenException('Not your car');

    // Check registration images exist
    if (car.images.length < 4) {
      throw new BadRequestException(
        'Car must have all 4 registration images before listing',
      );
    }

    // Check no active listing exists for this car
    const existingListing = await this.prisma.carListing.findFirst({
      where: { carId: dto.carId, listingStatus: 'ACTIVE' },
    });

    if (existingListing) {
      throw new BadRequestException(
        'This car already has an active listing',
      );
    }

    // Mark car as for resale
    await this.prisma.userCar.update({
      where: { id: dto.carId },
      data: { isForResale: true },
    });

    return this.prisma.carListing.create({
      data: {
        carId: dto.carId,
        userId,
        askingPrice: dto.askingPrice,
        title: dto.title,
        description: dto.description,
        isNegotiable: dto.isNegotiable ?? true,
      },
      include: {
        car: {
          include: {
            catalog: {
              select: {
                bodyType: true,
                fuelType: true,
                transmission: true,
                engineCapacity: true,
              },
            },
          },
        },
      },
    });
  }

  // ─── BROWSE LISTINGS (Public) ─────────────────────────────────

  async findAll(filters: ListingFilterDto) {
    const {
      manufacturer,
      modelName,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      city,
      condition,
      sortBy,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = { listingStatus: 'ACTIVE' };

    // Car filters
    const carWhere: any = { isActive: true };
    if (manufacturer) carWhere.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    if (modelName) carWhere.modelName = { contains: modelName, mode: 'insensitive' };
    if (yearMin || yearMax) {
      carWhere.year = {};
      if (yearMin) carWhere.year.gte = yearMin;
      if (yearMax) carWhere.year.lte = yearMax;
    }
    if (condition) carWhere.condition = condition;

    where.car = carWhere;

    // Price filters
    if (priceMin || priceMax) {
      where.askingPrice = {};
      if (priceMin) where.askingPrice.gte = priceMin;
      if (priceMax) where.askingPrice.lte = priceMax;
    }

    // City filter (from user)
    if (city) {
      where.user = { city: { contains: city, mode: 'insensitive' } };
    }

    // Sorting
    let orderBy: any = { listedAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { askingPrice: 'asc' };
    if (sortBy === 'price_desc') orderBy = { askingPrice: 'desc' };
    if (sortBy === 'oldest') orderBy = { listedAt: 'asc' };

    const [items, total] = await Promise.all([
      this.prisma.carListing.findMany({
        where,
        include: {
          car: {
            include: {
              catalog: {
                select: {
                  bodyType: true,
                  fuelType: true,
                  transmission: true,
                },
              },
              images: {
                where: { isCurrent: true, imageCategory: { in: ['REGISTRATION_FRONT'] } },
                take: 1,
              },
            },
          },
          user: {
            select: { city: true, fullName: true, accountType: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.carListing.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── GET LISTING DETAIL ───────────────────────────────────────

  async findOne(listingId: string) {
    const listing = await this.prisma.carListing.findUnique({
      where: { id: listingId },
      include: {
        car: {
          include: {
            catalog: true,
            images: {
              where: { isCurrent: true },
              orderBy: { imageCategory: 'asc' },
            },
          },
        },
        user: {
          select: {
            fullName: true,
            city: true,
            accountType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    // Increment view count
    await this.prisma.carListing.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
    });

    return listing;
  }

  // ─── UPDATE LISTING ───────────────────────────────────────────

  async update(listingId: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.carListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException('Not your listing');

    return this.prisma.carListing.update({
      where: { id: listingId },
      data: dto as any,
    });
  }

  // ─── UPDATE STATUS (sold, inactive) ───────────────────────────

  async updateStatus(
    listingId: string,
    userId: string,
    dto: UpdateListingStatusDto,
  ) {
    const listing = await this.prisma.carListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException('Not your listing');

    const data: any = { listingStatus: dto.listingStatus };

    if (dto.listingStatus === 'SOLD') {
      data.soldAt = new Date();
      // Update car's resale flag
      await this.prisma.userCar.update({
        where: { id: listing.carId },
        data: { isForResale: false },
      });
    }

    return this.prisma.carListing.update({
      where: { id: listingId },
      data,
    });
  }

  // ─── CONTACT SELLER (via Email) ───────────────────────────────

  async contactSeller(listingId: string, dto: ContactSellerDto) {
    const listing = await this.prisma.carListing.findUnique({
      where: { id: listingId },
      include: {
        user: { select: { email: true, fullName: true } },
        car: { select: { manufacturer: true, modelName: true, year: true } },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    // Send email to seller
    await this.emailService.sendEmail({
      to: listing.user.email,
      subject: `Inquiry about your ${listing.car.manufacturer} ${listing.car.modelName} ${listing.car.year}`,
      text: `
Dear ${listing.user.fullName},

You have a new inquiry about your listing: "${listing.title}"

From: ${dto.buyerName || 'A potential buyer'}
Email: ${dto.buyerEmail}

Message:
${dto.message}

---
This email was sent via Car Platform Marketplace.
      `.trim(),
    });

    return { message: 'Your message has been sent to the seller' };
  }

  // ─── GET MY LISTINGS ──────────────────────────────────────────

  async getMyListings(userId: string) {
    return this.prisma.carListing.findMany({
      where: { userId },
      include: {
        car: {
          select: {
            manufacturer: true,
            modelName: true,
            year: true,
            color: true,
            registrationNumber: true,
          },
        },
      },
      orderBy: { listedAt: 'desc' },
    });
  }
}
