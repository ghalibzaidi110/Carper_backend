import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface DamageDetectionResult {
  hasDamage: boolean;
  confidence: number;
  detections: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  }>;
  processedImageUrl?: string;
}

@Injectable()
export class DamageDetectionService {
  private readonly logger = new Logger(DamageDetectionService.name);
  private readonly serviceUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.serviceUrl = this.configService.get<string>(
      'DAMAGE_DETECTION_SERVICE_URL',
      'http://localhost:8000',
    );
  }

  /**
   * Run YOLOv8 damage detection on a single image
   */
  async detectOnImage(imageId: string, userId: string): Promise<DamageDetectionResult> {
    const image = await this.prisma.carImage.findUnique({
      where: { id: imageId },
      include: {
        car: { select: { userId: true } },
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (image.car.userId !== userId) {
      throw new BadRequestException('You do not own this car');
    }

    // Call Python FastAPI microservice
    const result = await this.callYoloService(image.imageUrl);

    // Store results in the image record
    await this.prisma.carImage.update({
      where: { id: imageId },
      data: {
        hasDamageDetected: result.hasDamage,
        damageDetectionData: result as any,
      },
    });

    return result;
  }

  /**
   * Run damage detection on all current periodic images of a car
   */
  async detectOnCar(carId: string, userId: string) {
    const car = await this.prisma.userCar.findFirst({
      where: { id: carId, userId, isActive: true },
    });

    if (!car) {
      throw new NotFoundException('Car not found or does not belong to you');
    }

    // Get all current periodic images
    const currentImages = await this.prisma.carImage.findMany({
      where: {
        carId,
        isCurrent: true,
        imageCategory: {
          in: [
            'PERIODIC_FRONT',
            'PERIODIC_BACK',
            'PERIODIC_LEFT',
            'PERIODIC_RIGHT',
          ],
        },
      },
    });

    if (currentImages.length === 0) {
      throw new BadRequestException(
        'No current periodic images found. Upload periodic images first.',
      );
    }

    // Run detection on each image
    const results = await Promise.all(
      currentImages.map(async (image) => {
        try {
          const result = await this.callYoloService(image.imageUrl);

          // Store results
          await this.prisma.carImage.update({
            where: { id: image.id },
            data: {
              hasDamageDetected: result.hasDamage,
              damageDetectionData: result as any,
            },
          });

          return {
            imageId: image.id,
            category: image.imageCategory,
            ...result,
          };
        } catch (error) {
          this.logger.error(
            `Detection failed for image ${image.id}: ${error.message}`,
          );
          return {
            imageId: image.id,
            category: image.imageCategory,
            hasDamage: false,
            confidence: 0,
            detections: [],
            error: error.message,
          };
        }
      }),
    );

    // Summary
    const totalDamages = results.filter((r) => r.hasDamage).length;

    return {
      carId,
      registrationNumber: car.registrationNumber,
      totalImagesScanned: currentImages.length,
      imagesWithDamage: totalDamages,
      results,
    };
  }

  /**
   * Get damage history for a car
   */
  async getDamageHistory(carId: string, userId: string) {
    const car = await this.prisma.userCar.findFirst({
      where: { id: carId, userId },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    const images = await this.prisma.carImage.findMany({
      where: {
        carId,
        hasDamageDetected: true,
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        imageCategory: true,
        imageUrl: true,
        thumbnailUrl: true,
        version: true,
        isCurrent: true,
        hasDamageDetected: true,
        damageDetectionData: true,
        uploadedAt: true,
      },
    });

    return {
      carId,
      registrationNumber: car.registrationNumber,
      totalDamageRecords: images.length,
      records: images,
    };
  }

  /**
   * Call the Python FastAPI YOLOv8 microservice
   */
  private async callYoloService(imageUrl: string): Promise<DamageDetectionResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.serviceUrl}/detect`, {
          image_url: imageUrl,
        }, {
          timeout: 30000, // 30s timeout for ML inference
        }),
      );

      const data = response.data;

      return {
        hasDamage: data.has_damage ?? false,
        confidence: data.confidence ?? 0,
        detections: (data.detections || []).map((d: any) => ({
          label: d.label,
          confidence: d.confidence,
          bbox: d.bbox,
        })),
        processedImageUrl: data.processed_image_url,
      };
    } catch (error) {
      this.logger.error(`YOLOv8 service error: ${error.message}`);
      throw new InternalServerErrorException(
        'Damage detection service is unavailable. Please try again later.',
      );
    }
  }
}
