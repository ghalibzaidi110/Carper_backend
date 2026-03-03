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
    async bulkImportCars(userId, csvData, validateOnly = false) {
        const { parse } = require('csv-parse/sync');
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        const results = {
            totalRows: records.length,
            successful: 0,
            failed: 0,
            errors: [],
            importedCars: [],
        };
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNumber = i + 2;
            try {
                this.validateBulkImportRow(row, rowNumber);
                const catalog = await this.prisma.carCatalog.findFirst({
                    where: {
                        manufacturer: { equals: row.manufacturer, mode: 'insensitive' },
                        modelName: { equals: row.modelName, mode: 'insensitive' },
                        year: parseInt(row.year),
                        variant: row.variant ? { equals: row.variant, mode: 'insensitive' } : undefined,
                        isActive: true,
                    },
                });
                if (!catalog) {
                    throw new common_1.BadRequestException(`Car model not found in catalog: ${row.manufacturer} ${row.modelName} ${row.year} ${row.variant || ''}`);
                }
                const existingCar = await this.prisma.userCar.findUnique({
                    where: { registrationNumber: row.registrationNumber },
                });
                if (existingCar) {
                    throw new common_1.ConflictException(`Duplicate registration number: ${row.registrationNumber}`);
                }
                if (!validateOnly) {
                    const car = await this.prisma.userCar.create({
                        data: {
                            userId,
                            catalogId: catalog.id,
                            registrationNumber: row.registrationNumber,
                            vinNumber: row.vinNumber || null,
                            manufacturer: catalog.manufacturer,
                            modelName: catalog.modelName,
                            year: catalog.year,
                            variant: catalog.variant,
                            color: row.color || null,
                            mileage: row.mileage ? parseInt(row.mileage) : null,
                            condition: row.condition?.toUpperCase() || 'USED',
                            purchaseDate: row.purchaseDate
                                ? new Date(row.purchaseDate)
                                : null,
                            purchasePrice: row.purchasePrice
                                ? parseFloat(row.purchasePrice)
                                : null,
                        },
                        include: {
                            catalog: {
                                select: {
                                    bodyType: true,
                                    fuelType: true,
                                    transmission: true,
                                },
                            },
                        },
                    });
                    results.importedCars.push(car);
                }
                results.successful++;
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    row: rowNumber,
                    error: error.message || 'Unknown error',
                });
            }
        }
        return results;
    }
    validateBulkImportRow(row, rowNumber) {
        const required = ['registrationNumber', 'manufacturer', 'modelName', 'year'];
        for (const field of required) {
            if (!row[field] || row[field].trim() === '') {
                throw new common_1.BadRequestException(`Row ${rowNumber}: Missing required field: ${field}`);
            }
        }
        const year = parseInt(row.year);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
            throw new common_1.BadRequestException(`Row ${rowNumber}: Invalid year: ${row.year}`);
        }
        if (row.mileage) {
            const mileage = parseInt(row.mileage);
            if (isNaN(mileage) || mileage < 0) {
                throw new common_1.BadRequestException(`Row ${rowNumber}: Invalid mileage: ${row.mileage}`);
            }
        }
        if (row.purchasePrice) {
            const price = parseFloat(row.purchasePrice);
            if (isNaN(price) || price < 0) {
                throw new common_1.BadRequestException(`Row ${rowNumber}: Invalid purchase price: ${row.purchasePrice}`);
            }
        }
        if (row.condition) {
            const validConditions = ['NEW', 'USED', 'SALVAGE'];
            if (!validConditions.includes(row.condition.toUpperCase())) {
                throw new common_1.BadRequestException(`Row ${rowNumber}: Invalid condition. Must be one of: ${validConditions.join(', ')}`);
            }
        }
    }
};
exports.UserCarsService = UserCarsService;
exports.UserCarsService = UserCarsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserCarsService);
//# sourceMappingURL=user-cars.service.js.map