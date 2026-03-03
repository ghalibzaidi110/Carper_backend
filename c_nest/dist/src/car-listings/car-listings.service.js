"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarListingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
let CarListingsService = class CarListingsService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async create(userId, dto) {
        const car = await this.prisma.userCar.findUnique({
            where: { id: dto.carId },
            include: {
                images: {
                    where: { isPermanent: true },
                },
            },
        });
        if (!car)
            throw new common_1.NotFoundException('Car not found');
        if (car.userId !== userId)
            throw new common_1.ForbiddenException('Not your car');
        if (car.images.length < 4) {
            throw new common_1.BadRequestException('Car must have all 4 registration images before listing');
        }
        const existingListing = await this.prisma.carListing.findFirst({
            where: { carId: dto.carId, listingStatus: 'ACTIVE' },
        });
        if (existingListing) {
            throw new common_1.BadRequestException('This car already has an active listing');
        }
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
    async findAll(filters) {
        const { manufacturer, modelName, yearMin, yearMax, priceMin, priceMax, city, condition, sortBy, page = 1, limit = 20, } = filters;
        const where = { listingStatus: 'ACTIVE' };
        const carWhere = { isActive: true };
        if (manufacturer)
            carWhere.manufacturer = { contains: manufacturer, mode: 'insensitive' };
        if (modelName)
            carWhere.modelName = { contains: modelName, mode: 'insensitive' };
        if (yearMin || yearMax) {
            carWhere.year = {};
            if (yearMin)
                carWhere.year.gte = yearMin;
            if (yearMax)
                carWhere.year.lte = yearMax;
        }
        if (condition)
            carWhere.condition = condition;
        where.car = carWhere;
        if (priceMin || priceMax) {
            where.askingPrice = {};
            if (priceMin)
                where.askingPrice.gte = priceMin;
            if (priceMax)
                where.askingPrice.lte = priceMax;
        }
        if (city) {
            where.user = { city: { contains: city, mode: 'insensitive' } };
        }
        let orderBy = { listedAt: 'desc' };
        if (sortBy === 'price_asc')
            orderBy = { askingPrice: 'asc' };
        if (sortBy === 'price_desc')
            orderBy = { askingPrice: 'desc' };
        if (sortBy === 'oldest')
            orderBy = { listedAt: 'asc' };
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
    async findOne(listingId) {
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
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        await this.prisma.carListing.update({
            where: { id: listingId },
            data: { viewCount: { increment: 1 } },
        });
        return listing;
    }
    async update(listingId, userId, dto) {
        const listing = await this.prisma.carListing.findUnique({
            where: { id: listingId },
        });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        if (listing.userId !== userId)
            throw new common_1.ForbiddenException('Not your listing');
        return this.prisma.carListing.update({
            where: { id: listingId },
            data: dto,
        });
    }
    async updateStatus(listingId, userId, dto) {
        const listing = await this.prisma.carListing.findUnique({
            where: { id: listingId },
        });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        if (listing.userId !== userId)
            throw new common_1.ForbiddenException('Not your listing');
        const data = { listingStatus: dto.listingStatus };
        if (dto.listingStatus === 'SOLD') {
            data.soldAt = new Date();
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
    async contactSeller(listingId, dto) {
        const listing = await this.prisma.carListing.findUnique({
            where: { id: listingId },
            include: {
                user: { select: { email: true, fullName: true } },
                car: { select: { manufacturer: true, modelName: true, year: true } },
            },
        });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
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
    async getMyListings(userId) {
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
};
exports.CarListingsService = CarListingsService;
exports.CarListingsService = CarListingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], CarListingsService);
//# sourceMappingURL=car-listings.service.js.map