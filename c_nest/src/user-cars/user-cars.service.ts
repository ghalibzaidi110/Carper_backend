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

  // ─── BULK IMPORT CARS FROM CSV ────────────────────────────────

  async bulkImportCars(
    userId: string,
    csvData: string,
    validateOnly: boolean = false,
  ) {
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
      errors: [] as Array<{ row: number; error: string }>,
      importedCars: [] as any[],
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        // Validate required fields
        this.validateBulkImportRow(row, rowNumber);

        // Check if catalog entry exists
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
          throw new BadRequestException(
            `Car model not found in catalog: ${row.manufacturer} ${row.modelName} ${row.year} ${row.variant || ''}`,
          );
        }

        // Check duplicate registration number
        const existingCar = await this.prisma.userCar.findUnique({
          where: { registrationNumber: row.registrationNumber },
        });

        if (existingCar) {
          throw new ConflictException(
            `Duplicate registration number: ${row.registrationNumber}`,
          );
        }

        if (!validateOnly) {
          // Create car
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
              condition: (row.condition?.toUpperCase() as any) || 'USED',
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
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  private validateBulkImportRow(row: any, rowNumber: number) {
    const required = ['registrationNumber', 'manufacturer', 'modelName', 'year'];

    for (const field of required) {
      if (!row[field] || row[field].trim() === '') {
        throw new BadRequestException(
          `Row ${rowNumber}: Missing required field: ${field}`,
        );
      }
    }

    // Validate year
    const year = parseInt(row.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      throw new BadRequestException(
        `Row ${rowNumber}: Invalid year: ${row.year}`,
      );
    }

    // Validate mileage if provided
    if (row.mileage) {
      const mileage = parseInt(row.mileage);
      if (isNaN(mileage) || mileage < 0) {
        throw new BadRequestException(
          `Row ${rowNumber}: Invalid mileage: ${row.mileage}`,
        );
      }
    }

    // Validate purchase price if provided
    if (row.purchasePrice) {
      const price = parseFloat(row.purchasePrice);
      if (isNaN(price) || price < 0) {
        throw new BadRequestException(
          `Row ${rowNumber}: Invalid purchase price: ${row.purchasePrice}`,
        );
      }
    }

    // Validate condition if provided
    if (row.condition) {
      const validConditions = ['NEW', 'USED', 'SALVAGE'];
      if (!validConditions.includes(row.condition.toUpperCase())) {
        throw new BadRequestException(
          `Row ${rowNumber}: Invalid condition. Must be one of: ${validConditions.join(', ')}`,
        );
      }
    }
  }
}
