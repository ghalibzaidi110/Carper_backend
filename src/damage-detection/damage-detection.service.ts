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
import { CloudinaryService } from '../cloudinary/cloudinary.service';
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

export interface ScanByUploadResultItem {
  originalImageUrl: string;
  processedImageUrl: string;
  hasDamage: boolean;
  confidence: number;
  detections: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  severity?: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE';
}

export interface ScanByUploadResponse {
  summary: {
    totalImages: number;
    imagesWithDamage: number;
    isDemoMode: boolean;
  };
  results: ScanByUploadResultItem[];
}

@Injectable()
export class DamageDetectionService {
  private readonly logger = new Logger(DamageDetectionService.name);
  private readonly serviceUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private httpService: HttpService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.serviceUrl = this.configService.get<string>(
      'DAMAGE_DETECTION_SERVICE_URL',
      'http://localhost:8000',
    );
  }

  /**
   * Accept image(s) via upload, optionally call Python API; when Python is unavailable
   * upload to Cloudinary, apply a visual transformation to differentiate "processed"
   * image from original, and return dummy damage data.
   */
  async scanByUpload(files: Express.Multer.File[]): Promise<ScanByUploadResponse> {
    if (!files?.length) {
      throw new BadRequestException('At least one image is required');
    }

    const usePython = await this.isPythonServiceAvailable();
    const results: ScanByUploadResultItem[] = [];

    const placeholderUrl = 'https://via.placeholder.com/800x600?text=Image+upload+skipped+(configure+Cloudinary+for+real+upload)';

    for (const file of files) {
      if (!file.buffer?.length) continue;

      let originalUrl: string;
      try {
        const uploaded = await this.cloudinaryService.uploadImage(
          file,
          'damage-scan',
          10,
        );
        originalUrl = uploaded.secure_url;
      } catch (err: any) {
        this.logger.warn(
          `Cloudinary upload failed (${err?.message ?? err}), returning placeholder. Configure CLOUDINARY_* in .env for real uploads.`,
        );
        originalUrl = placeholderUrl;
      }

      let processedUrl: string;
      let hasDamage: boolean;
      let confidence: number;
      let detections: Array<{ label: string; confidence: number; bbox: [number, number, number, number] }>;

      if (usePython) {
        try {
          const pythonResult = await this.callYoloService(originalUrl);
          processedUrl = pythonResult.processedImageUrl ?? originalUrl;
          hasDamage = pythonResult.hasDamage;
          confidence = pythonResult.confidence;
          detections = pythonResult.detections ?? [];
        } catch (e) {
          this.logger.warn(`Python service failed for one image, using demo response: ${e?.message}`);
          processedUrl = this.buildProcessedImageUrl(originalUrl);
          const dummy = this.getDummyDetectionResult();
          hasDamage = dummy.hasDamage;
          confidence = dummy.confidence;
          detections = dummy.detections;
        }
      } else {
        processedUrl =
          originalUrl === placeholderUrl
            ? placeholderUrl
            : this.buildProcessedImageUrl(originalUrl);
        const dummy = this.getDummyDetectionResult();
        hasDamage = dummy.hasDamage;
        confidence = dummy.confidence;
        detections = dummy.detections;
      }

      const severity = this.getSeverity(hasDamage, confidence);
      results.push({
        originalImageUrl: originalUrl,
        processedImageUrl: processedUrl,
        hasDamage,
        confidence,
        detections,
        severity,
      });
    }

    const imagesWithDamage = results.filter((r) => r.hasDamage).length;
    return {
      summary: {
        totalImages: results.length,
        imagesWithDamage,
        isDemoMode: !usePython,
      },
      results,
    };
  }

  private buildProcessedImageUrl(originalUrl: string): string {
    if (!originalUrl.includes('/upload/')) return originalUrl;
    const transformation = 'bo_3px_solid_red';
    return originalUrl.replace('/upload/', `/upload/${transformation}/`);
  }

  private getDummyDetectionResult(): {
    hasDamage: boolean;
    confidence: number;
    detections: Array<{ label: string; confidence: number; bbox: [number, number, number, number] }>;
  } {
    return {
      hasDamage: false,
      confidence: 0,
      detections: [],
    };
  }

  private getSeverity(hasDamage: boolean, confidence: number): 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE' {
    if (!hasDamage) return 'NONE';
    if (confidence >= 0.8) return 'SEVERE';
    if (confidence >= 0.5) return 'MODERATE';
    return 'MINOR';
  }

  private async isPythonServiceAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.serviceUrl}/health`, { timeout: 2000 }),
      );
      return true;
    } catch {
      return false;
    }
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
