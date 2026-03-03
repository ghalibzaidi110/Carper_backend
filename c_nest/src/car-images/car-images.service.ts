import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ImageCategory } from '@prisma/client';

const REGISTRATION_CATEGORIES: ImageCategory[] = [
  'REGISTRATION_FRONT',
  'REGISTRATION_BACK',
  'REGISTRATION_LEFT',
  'REGISTRATION_RIGHT',
];

const PERIODIC_CATEGORIES: ImageCategory[] = [
  'PERIODIC_FRONT',
  'PERIODIC_BACK',
  'PERIODIC_LEFT',
  'PERIODIC_RIGHT',
];

@Injectable()
export class CarImagesService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // ─── UPLOAD REGISTRATION IMAGES (4 images, permanent) ────────

  async uploadRegistrationImages(
    carId: string,
    userId: string,
    files: {
      front: Express.Multer.File[];
      back: Express.Multer.File[];
      left: Express.Multer.File[];
      right: Express.Multer.File[];
    },
  ) {
    // Verify car ownership
    const car = await this.prisma.userCar.findUnique({
      where: { id: carId },
    });

    if (!car) throw new NotFoundException('Car not found');
    if (car.userId !== userId) throw new ForbiddenException('Not your car');

    // Check if registration images already exist
    const existingCount = await this.prisma.carImage.count({
      where: {
        carId,
        isPermanent: true,
        imageCategory: { in: REGISTRATION_CATEGORIES },
      },
    });

    if (existingCount > 0) {
      throw new BadRequestException(
        'Registration images already exist and cannot be changed',
      );
    }

    // Validate all 4 images are provided
    if (!files.front?.[0] || !files.back?.[0] || !files.left?.[0] || !files.right?.[0]) {
      throw new BadRequestException(
        'All 4 registration images are required: front, back, left, right',
      );
    }

    // Upload all 4 to Cloudinary
    const folder = `car-images/${carId}/registration`;
    const [frontResult, backResult, leftResult, rightResult] = await Promise.all([
      this.cloudinaryService.uploadImage(files.front[0], folder),
      this.cloudinaryService.uploadImage(files.back[0], folder),
      this.cloudinaryService.uploadImage(files.left[0], folder),
      this.cloudinaryService.uploadImage(files.right[0], folder),
    ]);

    // Create image records
    const images = await this.prisma.$transaction([
      this.prisma.carImage.create({
        data: {
          carId,
          imageCategory: 'REGISTRATION_FRONT',
          imageUrl: frontResult.secure_url,
          thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(frontResult.secure_url),
          cloudinaryPublicId: frontResult.public_id,
          fileSize: frontResult.bytes,
          fileType: frontResult.format,
          isPermanent: true,
          isCurrent: true,
          version: 1,
        },
      }),
      this.prisma.carImage.create({
        data: {
          carId,
          imageCategory: 'REGISTRATION_BACK',
          imageUrl: backResult.secure_url,
          thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(backResult.secure_url),
          cloudinaryPublicId: backResult.public_id,
          fileSize: backResult.bytes,
          fileType: backResult.format,
          isPermanent: true,
          isCurrent: true,
          version: 1,
        },
      }),
      this.prisma.carImage.create({
        data: {
          carId,
          imageCategory: 'REGISTRATION_LEFT',
          imageUrl: leftResult.secure_url,
          thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(leftResult.secure_url),
          cloudinaryPublicId: leftResult.public_id,
          fileSize: leftResult.bytes,
          fileType: leftResult.format,
          isPermanent: true,
          isCurrent: true,
          version: 1,
        },
      }),
      this.prisma.carImage.create({
        data: {
          carId,
          imageCategory: 'REGISTRATION_RIGHT',
          imageUrl: rightResult.secure_url,
          thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(rightResult.secure_url),
          cloudinaryPublicId: rightResult.public_id,
          fileSize: rightResult.bytes,
          fileType: rightResult.format,
          isPermanent: true,
          isCurrent: true,
          version: 1,
        },
      }),
    ]);

    return images;
  }

  // ─── UPLOAD PERIODIC INSPECTION IMAGES ────────────────────────

  async uploadPeriodicImages(
    carId: string,
    userId: string,
    files: {
      front: Express.Multer.File[];
      back: Express.Multer.File[];
      left: Express.Multer.File[];
      right: Express.Multer.File[];
    },
  ) {
    const car = await this.prisma.userCar.findUnique({
      where: { id: carId },
    });

    if (!car) throw new NotFoundException('Car not found');
    if (car.userId !== userId) throw new ForbiddenException('Not your car');

    if (!files.front?.[0] || !files.back?.[0] || !files.left?.[0] || !files.right?.[0]) {
      throw new BadRequestException(
        'All 4 periodic images are required: front, back, left, right',
      );
    }

    // Get current max version for periodic images
    const latestPeriodic = await this.prisma.carImage.findFirst({
      where: {
        carId,
        imageCategory: { in: PERIODIC_CATEGORIES },
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersion = (latestPeriodic?.version || 0) + 1;

    // Mark old periodic images as not current
    await this.prisma.carImage.updateMany({
      where: {
        carId,
        imageCategory: { in: PERIODIC_CATEGORIES },
        isCurrent: true,
      },
      data: { isCurrent: false },
    });

    // Upload new images
    const folder = `car-images/${carId}/periodic/v${newVersion}`;
    const [frontResult, backResult, leftResult, rightResult] = await Promise.all([
      this.cloudinaryService.uploadImage(files.front[0], folder),
      this.cloudinaryService.uploadImage(files.back[0], folder),
      this.cloudinaryService.uploadImage(files.left[0], folder),
      this.cloudinaryService.uploadImage(files.right[0], folder),
    ]);

    const images = await this.prisma.$transaction([
      this.prisma.carImage.create({
        data: {
          carId,
          imageCategory: 'PERIODIC_FRONT',
          imageUrl: frontResult.secure_url,
          thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(frontResult.secure_url),
          cloudinaryPublicId: frontResult.public_id,
          fileSize: frontResult.bytes,
          fileType: frontResult.format,
          isPermanent: false,
          isCurrent: true,
          version: newVersion,
        },
      }),
      this.prisma.carImage.create({
        data: {
          carId,
          imageCategory: 'PERIODIC_BACK',
          imageUrl: backResult.secure_url,
          thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(backResult.secure_url),
          cloudinaryPublicId: backResult.public_id,
          fileSize: backResult.bytes,
          fileType: backResult.format,
          isPermanent: false,
          isCurrent: true,
          version: newVersion,
        },
      }),
      this.prisma.carImage.create({
        data: {
          carId,
          imageCategory: 'PERIODIC_LEFT',
          imageUrl: leftResult.secure_url,
          thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(leftResult.secure_url),
          cloudinaryPublicId: leftResult.public_id,
          fileSize: leftResult.bytes,
          fileType: leftResult.format,
          isPermanent: false,
          isCurrent: true,
          version: newVersion,
        },
      }),
      this.prisma.carImage.create({
        data: {
          carId,
          imageCategory: 'PERIODIC_RIGHT',
          imageUrl: rightResult.secure_url,
          thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(rightResult.secure_url),
          cloudinaryPublicId: rightResult.public_id,
          fileSize: rightResult.bytes,
          fileType: rightResult.format,
          isPermanent: false,
          isCurrent: true,
          version: newVersion,
        },
      }),
    ]);

    return { version: newVersion, images };
  }

  // ─── UPLOAD SINGLE IMAGE (damage/listing) ─────────────────────

  async uploadSingleImage(
    carId: string,
    userId: string,
    file: Express.Multer.File,
    category: ImageCategory,
  ) {
    const car = await this.prisma.userCar.findUnique({
      where: { id: carId },
    });

    if (!car) throw new NotFoundException('Car not found');
    if (car.userId !== userId) throw new ForbiddenException('Not your car');

    const folder = `car-images/${carId}/${category.toLowerCase()}`;
    const result = await this.cloudinaryService.uploadImage(file, folder);

    return this.prisma.carImage.create({
      data: {
        carId,
        imageCategory: category,
        imageUrl: result.secure_url,
        thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(result.secure_url),
        cloudinaryPublicId: result.public_id,
        fileSize: result.bytes,
        fileType: result.format,
        isPermanent: false,
        isCurrent: true,
      },
    });
  }

  // ─── GET ALL IMAGES FOR A CAR ─────────────────────────────────

  async getCarImages(carId: string, currentOnly: boolean = false) {
    const where: any = { carId };
    if (currentOnly) where.isCurrent = true;

    return this.prisma.carImage.findMany({
      where,
      orderBy: [{ imageCategory: 'asc' }, { version: 'desc' }],
    });
  }

  // ─── GET REGISTRATION IMAGES ──────────────────────────────────

  async getRegistrationImages(carId: string) {
    return this.prisma.carImage.findMany({
      where: {
        carId,
        isPermanent: true,
        imageCategory: { in: REGISTRATION_CATEGORIES },
      },
      orderBy: { imageCategory: 'asc' },
    });
  }

  // ─── GET INSPECTION HISTORY ───────────────────────────────────

  async getInspectionHistory(carId: string) {
    const images = await this.prisma.carImage.findMany({
      where: {
        carId,
        imageCategory: { in: PERIODIC_CATEGORIES },
      },
      orderBy: [{ version: 'desc' }, { imageCategory: 'asc' }],
    });

    // Group by version
    const grouped: Record<number, any[]> = {};
    for (const img of images) {
      if (!grouped[img.version]) grouped[img.version] = [];
      grouped[img.version].push(img);
    }

    return Object.entries(grouped)
      .map(([version, imgs]) => ({
        version: Number(version),
        images: imgs,
        uploadedAt: imgs[0]?.uploadedAt,
        isCurrent: imgs[0]?.isCurrent,
      }))
      .sort((a, b) => b.version - a.version);
  }

  // ─── GET CURRENT PERIODIC VERSION ─────────────────────────────

  async getCurrentPeriodicVersion(carId: string): Promise<number> {
    const latest = await this.prisma.carImage.findFirst({
      where: {
        carId,
        imageCategory: { in: PERIODIC_CATEGORIES },
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return latest?.version || 0;
  }
}
