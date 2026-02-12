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
exports.RentalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let RentalsService = class RentalsService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.accountType !== client_1.AccountType.CAR_RENTAL) {
            throw new common_1.ForbiddenException('Only car rental businesses can create rentals');
        }
        const car = await this.prisma.userCar.findFirst({
            where: { id: dto.carId, userId, isActive: true },
        });
        if (!car) {
            throw new common_1.NotFoundException('Car not found or does not belong to you');
        }
        const activeRental = await this.prisma.rental.findFirst({
            where: { carId: dto.carId, status: client_1.RentalStatus.ACTIVE },
        });
        if (activeRental) {
            throw new common_1.BadRequestException('This car already has an active rental');
        }
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
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
    async findAll(userId, filters) {
        const { status, carId, fromDate, toDate, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (status)
            where.status = status;
        if (carId)
            where.carId = carId;
        if (fromDate || toDate) {
            where.startDate = {};
            if (fromDate)
                where.startDate.gte = new Date(fromDate);
            if (toDate)
                where.startDate.lte = new Date(toDate);
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
    async findOne(id, userId) {
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
            throw new common_1.NotFoundException('Rental not found');
        }
        return rental;
    }
    async completeRental(id, userId, dto) {
        const rental = await this.prisma.rental.findFirst({
            where: { id, userId },
            include: { car: true },
        });
        if (!rental) {
            throw new common_1.NotFoundException('Rental not found');
        }
        if (rental.status !== client_1.RentalStatus.ACTIVE) {
            throw new common_1.BadRequestException('Only active rentals can be completed');
        }
        const latestImage = await this.prisma.carImage.findFirst({
            where: { carId: rental.carId, isCurrent: true },
            orderBy: { version: 'desc' },
        });
        const totalCharges = dto.totalCharges ??
            Number(rental.rentalPrice) + (dto.damageCharges || 0);
        const updated = await this.prisma.rental.update({
            where: { id },
            data: {
                status: client_1.RentalStatus.COMPLETED,
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
        await this.notificationsService.create(userId, {
            title: 'Rental Completed',
            message: `Rental for ${updated.car.manufacturer} ${updated.car.modelName} (${updated.car.registrationNumber}) has been completed.`,
            type: 'SUCCESS',
        });
        return updated;
    }
    async cancelRental(id, userId) {
        const rental = await this.prisma.rental.findFirst({
            where: { id, userId },
        });
        if (!rental) {
            throw new common_1.NotFoundException('Rental not found');
        }
        if (rental.status !== client_1.RentalStatus.ACTIVE) {
            throw new common_1.BadRequestException('Only active rentals can be cancelled');
        }
        return this.prisma.rental.update({
            where: { id },
            data: { status: client_1.RentalStatus.CANCELLED },
        });
    }
    async getBusinessStats(userId) {
        const [active, completed, totalRevenue, totalRentals] = await Promise.all([
            this.prisma.rental.count({ where: { userId, status: client_1.RentalStatus.ACTIVE } }),
            this.prisma.rental.count({ where: { userId, status: client_1.RentalStatus.COMPLETED } }),
            this.prisma.rental.aggregate({
                where: { userId, status: client_1.RentalStatus.COMPLETED },
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
};
exports.RentalsService = RentalsService;
exports.RentalsService = RentalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], RentalsService);
//# sourceMappingURL=rentals.service.js.map