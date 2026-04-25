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
import FormData from 'form-data';

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
    let realDetectionCount = 0;

    for (const file of files) {
      if (!file.buffer?.length) continue;

      // Try Cloudinary upload; if it fails, fall back to a data: URL of the
      // original bytes so the frontend can still display the original image.
      let originalUrl: string;
      let cloudinaryWorked = true;
      try {
        const uploaded = await this.cloudinaryService.uploadImage(
          file,
          'damage-scan',
          10,
        );
        originalUrl = uploaded.secure_url;
      } catch (err: any) {
        this.logger.warn(
          `Cloudinary upload failed (${err?.message ?? err}). Falling back to direct file upload to Python.`,
        );
        cloudinaryWorked = false;
        originalUrl = this.bytesToDataUrl(file.buffer, file.mimetype);
      }

      let processedUrl: string;
      let hasDamage: boolean;
      let confidence: number;
      let detections: Array<{ label: string; confidence: number; bbox: [number, number, number, number] }>;

      if (usePython) {
        try {
          const pythonResult = cloudinaryWorked
            ? await this.callYoloService(originalUrl)
            : await this.callYoloUpload(file);
          processedUrl = pythonResult.processedImageUrl ?? originalUrl;
          hasDamage = pythonResult.hasDamage;
          confidence = pythonResult.confidence;
          detections = pythonResult.detections ?? [];
          realDetectionCount += 1;

          // Annotated image arrives as a base64 data: URL. If Cloudinary is
          // available, persist it there and replace the data: URL with a CDN URL.
          if (cloudinaryWorked && processedUrl.startsWith('data:image/')) {
            try {
              const annotatedUrl = await this.uploadAnnotatedToCloudinary(
                processedUrl,
                file.originalname || 'scan',
              );
              if (annotatedUrl) processedUrl = annotatedUrl;
            } catch (uploadErr: any) {
              this.logger.warn(
                `Failed to upload annotated image to Cloudinary: ${uploadErr?.message}. Returning data URL as fallback.`,
              );
            }
          }

          this.logger.log(
            `Detection succeeded via ${cloudinaryWorked ? 'URL' : 'direct upload'}: ${detections.length} detection(s), max confidence ${confidence}`,
          );
        } catch (e) {
          this.logger.warn(`Python service failed for one image, using demo response: ${e?.message}`);
          processedUrl = this.buildProcessedImageUrl(originalUrl);
          const dummy = this.getDummyDetectionResult();
          hasDamage = dummy.hasDamage;
          confidence = dummy.confidence;
          detections = dummy.detections;
        }
      } else {
        processedUrl = this.buildProcessedImageUrl(originalUrl);
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

    // Demo mode is true when Python is down OR when every per-image call fell back
    const isDemoMode = !usePython || (results.length > 0 && realDetectionCount === 0);
    const imagesWithDamage = results.filter((r) => r.hasDamage).length;
    return {
      summary: {
        totalImages: results.length,
        imagesWithDamage,
        isDemoMode,
      },
      results,
    };
  }

  private buildProcessedImageUrl(originalUrl: string): string {
    if (!originalUrl.includes('/upload/')) return originalUrl;
    const transformation = 'bo_3px_solid_red';
    return originalUrl.replace('/upload/', `/upload/${transformation}/`);
  }

  private bytesToDataUrl(buffer: Buffer, mimetype?: string): string {
    const mime = mimetype || 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }

  /**
   * Decode a `data:image/...;base64,...` URL (Python annotated frame) and
   * upload the resulting bytes to Cloudinary. Returns the secure URL or null
   * if the input wasn't a parseable data URL.
   */
  private async uploadAnnotatedToCloudinary(
    dataUrl: string,
    originalFilename: string,
  ): Promise<string | null> {
    const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
    if (!match) return null;
    const ext = match[1].split('/')[1].replace('+xml', '');
    const buffer = Buffer.from(match[2], 'base64');
    const stem = (originalFilename || 'scan').replace(/\.[^/.]+$/, '');
    const filename = `annotated-${stem}-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const result = await this.cloudinaryService.uploadBuffer(
      buffer,
      'damage-scan-annotated',
      filename,
    );
    return result.secure_url;
  }

  /**
   * Send raw image bytes directly to the Python /detect-upload endpoint
   * (multipart). Use when the image isn't already hosted at a URL — e.g.
   * Cloudinary isn't configured or upload failed.
   */
  private async callYoloUpload(file: Express.Multer.File): Promise<DamageDetectionResult> {
    try {
      const form = new FormData();
      form.append('file', file.buffer, {
        filename: file.originalname || 'upload.jpg',
        contentType: file.mimetype || 'image/jpeg',
      });
      const response = await firstValueFrom(
        this.httpService.post(`${this.serviceUrl}/detect-upload`, form, {
          headers: form.getHeaders(),
          timeout: 30000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
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
    } catch (error: any) {
      this.logger.error(`YOLOv8 upload-mode error: ${error?.message ?? error}`);
      throw new InternalServerErrorException(
        'Damage detection service is unavailable. Please try again later.',
      );
    }
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
