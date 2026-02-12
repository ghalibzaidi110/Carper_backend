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
exports.UserCarsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserCarsService = class UserCarsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async registerCar(userId, dto) {
        const existing = await this.prisma.userCar.findUnique({
            where: { registrationNumber: dto.registrationNumber },
        });
        if (existing) {
            throw new common_1.ConflictException('A car with this registration number already exists');
        }
        const catalog = await this.prisma.carCatalog.findUnique({
            where: { id: dto.catalogId },
        });
        if (!catalog) {
            throw new common_1.NotFoundException('Car model not found in catalog. Only cars in the catalog can be registered.');
        }
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
    async findAllByUser(userId) {
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
    async findOne(carId, userId) {
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
            throw new common_1.NotFoundException('Car not found');
        }
        if (userId && car.userId !== userId) {
            throw new common_1.ForbiddenException('You do not own this car');
        }
        return car;
    }
    async update(carId, userId, dto) {
        const car = await this.findOne(carId, userId);
        return this.prisma.userCar.update({
            where: { id: carId },
            data: dto,
        });
    }
    async remove(carId, userId) {
        const car = await this.prisma.userCar.findUnique({
            where: { id: carId },
            include: {
                listings: { where: { listingStatus: 'ACTIVE' } },
                rentals: { where: { status: 'ACTIVE' } },
            },
        });
        if (!car) {
            throw new common_1.NotFoundException('Car not found');
        }
        if (car.userId !== userId) {
            throw new common_1.ForbiddenException('You do not own this car');
        }
        if (car.listings.length > 0) {
            throw new common_1.BadRequestException('Cannot delete a car with active listings. Please close the listing first.');
        }
        if (car.rentals.length > 0) {
            throw new common_1.BadRequestException('Cannot delete a car with active rentals.');
        }
        return this.prisma.userCar.update({
            where: { id: carId },
            data: { isActive: false },
        });
    }
    async hasRegistrationImages(carId) {
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
};
exports.UserCarsService = UserCarsService;
exports.UserCarsService = UserCarsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserCarsService);
//# sourceMappingURL=user-cars.service.js.map