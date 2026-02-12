import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogDto, UpdateCatalogDto, CatalogFilterDto } from './dto';

@Injectable()
export class CarCatalogService {
  constructor(private prisma: PrismaService) {}

  // ─── CREATE CATALOG ENTRY (Admin) ─────────────────────────────

  async create(dto: CreateCatalogDto) {
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

  // ─── BULK CREATE (Admin - CSV import) ─────────────────────────

  async bulkCreate(entries: CreateCatalogDto[]) {
    const results = await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.carCatalog.create({
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
        }),
      ),
    );

    return { count: results.length, entries: results };
  }

  // ─── GET ALL (with filters & pagination) ──────────────────────

  async findAll(filters: CatalogFilterDto) {
    const { manufacturer, modelName, year, bodyType, fuelType, page = 1, limit = 20 } = filters;

    const where: any = { isActive: true };
    if (manufacturer) where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    if (modelName) where.modelName = { contains: modelName, mode: 'insensitive' };
    if (year) where.year = year;
    if (bodyType) where.bodyType = bodyType;
    if (fuelType) where.fuelType = fuelType;

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

  // ─── GET ONE ──────────────────────────────────────────────────

  async findOne(id: string) {
    const catalog = await this.prisma.carCatalog.findUnique({
      where: { id },
      include: { images: { orderBy: { imageOrder: 'asc' } } },
    });

    if (!catalog) {
      throw new NotFoundException('Catalog entry not found');
    }

    return catalog;
  }

  // ─── UPDATE (Admin) ───────────────────────────────────────────

  async update(id: string, dto: UpdateCatalogDto) {
    await this.findOne(id); // Ensure exists

    return this.prisma.carCatalog.update({
      where: { id },
      data: dto as any,
      include: { images: true },
    });
  }

  // ─── DELETE (Admin - mark inactive if linked cars exist) ──────

  async remove(id: string) {
    const catalog = await this.prisma.carCatalog.findUnique({
      where: { id },
      include: { userCars: { take: 1 } },
    });

    if (!catalog) {
      throw new NotFoundException('Catalog entry not found');
    }

    if (catalog.userCars.length > 0) {
      // Has linked user cars - mark inactive instead of deleting
      return this.prisma.carCatalog.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // No linked cars - safe to delete
    return this.prisma.carCatalog.delete({ where: { id } });
  }

  // ─── ADD CATALOG IMAGE (Admin) ────────────────────────────────

  async addImage(
    catalogId: string,
    imageUrl: string,
    isPrimary: boolean = false,
    altText?: string,
  ) {
    await this.findOne(catalogId);

    // If setting as primary, unset others
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

  // ─── GET MANUFACTURERS LIST ───────────────────────────────────

  async getManufacturers() {
    const manufacturers = await this.prisma.carCatalog.findMany({
      where: { isActive: true },
      select: { manufacturer: true },
      distinct: ['manufacturer'],
      orderBy: { manufacturer: 'asc' },
    });

    return manufacturers.map((m) => m.manufacturer);
  }

  // ─── GET MODELS BY MANUFACTURER ───────────────────────────────

  async getModelsByManufacturer(manufacturer: string) {
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
}
