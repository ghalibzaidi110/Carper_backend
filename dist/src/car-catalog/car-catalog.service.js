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
exports.CarCatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CarCatalogService = class CarCatalogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.carCatalog.create({
            data: {
                manufacturer: dto.manufacturer,
                modelName: dto.modelName,
                year: dto.year,
                variant: dto.variant,
                bodyType: dto.bodyType,
                fuelType: dto.fuelType,
                transmission: dto.transmission,
                engineCapacity: dto.engineCapacity,
                seatingCapacity: dto.seatingCapacity,
                basePrice: dto.basePrice,
                description: dto.description,
                features: dto.features || [],
            },
            include: { images: true },
        });
    }
    async bulkCreate(entries) {
        const results = await this.prisma.$transaction(entries.map((entry) => this.prisma.carCatalog.create({
            data: {
                manufacturer: entry.manufacturer,
                modelName: entry.modelName,
                year: entry.year,
                variant: entry.variant,
                bodyType: entry.bodyType,
                fuelType: entry.fuelType,
                transmission: entry.transmission,
                engineCapacity: entry.engineCapacity,
                seatingCapacity: entry.seatingCapacity,
                basePrice: entry.basePrice,
                description: entry.description,
                features: entry.features || [],
            },
        })));
        return { count: results.length, entries: results };
    }
    async findAll(filters) {
        const { manufacturer, modelName, year, bodyType, fuelType, page = 1, limit = 20 } = filters;
        const where = { isActive: true };
        if (manufacturer)
            where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
        if (modelName)
            where.modelName = { contains: modelName, mode: 'insensitive' };
        if (year)
            where.year = year;
        if (bodyType)
            where.bodyType = bodyType;
        if (fuelType)
            where.fuelType = fuelType;
        const [items, total] = await Promise.all([
            this.prisma.carCatalog.findMany({
                where,
                include: { images: { where: { isPrimary: true } } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.carCatalog.count({ where }),
        ]);
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const catalog = await this.prisma.carCatalog.findUnique({
            where: { id },
            include: { images: { orderBy: { imageOrder: 'asc' } } },
        });
        if (!catalog) {
            throw new common_1.NotFoundException('Catalog entry not found');
        }
        return catalog;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.carCatalog.update({
            where: { id },
            data: dto,
            include: { images: true },
        });
    }
    async remove(id) {
        const catalog = await this.prisma.carCatalog.findUnique({
            where: { id },
            include: { userCars: { take: 1 } },
        });
        if (!catalog) {
            throw new common_1.NotFoundException('Catalog entry not found');
        }
        if (catalog.userCars.length > 0) {
            return this.prisma.carCatalog.update({
                where: { id },
                data: { isActive: false },
            });
        }
        return this.prisma.carCatalog.delete({ where: { id } });
    }
    async addImage(catalogId, imageUrl, isPrimary = false, altText) {
        await this.findOne(catalogId);
        if (isPrimary) {
            await this.prisma.carCatalogImage.updateMany({
                where: { catalogId },
                data: { isPrimary: false },
            });
        }
        return this.prisma.carCatalogImage.create({
            data: {
                catalogId,
                imageUrl,
                isPrimary,
                altText,
            },
        });
    }
    async getManufacturers() {
        const manufacturers = await this.prisma.carCatalog.findMany({
            where: { isActive: true },
            select: { manufacturer: true },
            distinct: ['manufacturer'],
            orderBy: { manufacturer: 'asc' },
        });
        return manufacturers.map((m) => m.manufacturer);
    }
    async getModelsByManufacturer(manufacturer) {
        return this.prisma.carCatalog.findMany({
            where: {
                manufacturer: { equals: manufacturer, mode: 'insensitive' },
                isActive: true,
            },
            select: {
                id: true,
                modelName: true,
                year: true,
                variant: true,
                basePrice: true,
            },
            orderBy: [{ modelName: 'asc' }, { year: 'desc' }],
        });
    }
};
exports.CarCatalogService = CarCatalogService;
exports.CarCatalogService = CarCatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CarCatalogService);
//# sourceMappingURL=car-catalog.service.js.map