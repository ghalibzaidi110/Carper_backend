import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Log the loaded config (masking sensitive values) so misconfigurations are visible at startup
    const mask = (v?: string) =>
      !v ? 'MISSING' : `${v.slice(0, 3)}***${v.slice(-2)} (${v.length} chars)`;
    this.logger.log(
      `Cloudinary config -> cloud_name: ${cloudName ?? 'MISSING'}, api_key: ${mask(apiKey)}, api_secret: ${mask(apiSecret)}`,
    );
  }

  /**
   * Upload a single image to Cloudinary.
   * @param file - Express Multer file
   * @param folder - Cloudinary folder path (e.g., 'car-images/registration')
   * @param maxSizeMB - Maximum file size in MB (default: 10)
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    maxSizeMB: number = 10,
  ): Promise<UploadApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPG, PNG, WEBP',
      );
    }

    // Validate file size with custom limit
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${maxSizeMB}MB limit`,
      );
    }

    try {
      return await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `car-platform/${folder}`,
            resource_type: 'image',
            transformation: [
              { width: 1920, height: 1080, crop: 'limit' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!);
          },
        );

        const stream = Readable.from(file.buffer);
        stream.pipe(uploadStream);
      });
    } catch (err: any) {
      // Log the FULL Cloudinary error so configuration issues are easy to diagnose
      this.logger.error(
        `Cloudinary upload error -> http_code=${err?.http_code} message="${err?.message}" name=${err?.name}`,
      );
      const msg = err?.message || String(err);
      if (msg.includes('Invalid cloud_name') || err?.http_code === 401) {
        throw new BadRequestException(
          'Invalid Cloudinary configuration. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env. Use the exact values from your Cloudinary Dashboard.',
        );
      }
      throw new BadRequestException(
        err?.message ? `Image upload failed: ${err.message}` : 'Image upload failed',
      );
    }
  }

  /**
   * Upload multiple images to Cloudinary.
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<UploadApiResponse[]> {
    const uploads = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploads);
  }

  /**
   * Upload raw image bytes (no Multer file). Used for images we generate
   * server-side (e.g., the YOLO-annotated frame returned by Python).
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    filename = 'image.jpg',
  ): Promise<UploadApiResponse> {
    if (!buffer?.length) {
      throw new BadRequestException('No image data provided');
    }
    try {
      return await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `car-platform/${folder}`,
            resource_type: 'image',
            public_id: filename.replace(/\.[^/.]+$/, ''),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!);
          },
        );
        Readable.from(buffer).pipe(uploadStream);
      });
    } catch (err: any) {
      this.logger.error(
        `Cloudinary buffer upload error -> http_code=${err?.http_code} message="${err?.message}"`,
      );
      throw new BadRequestException(
        err?.message ? `Image upload failed: ${err.message}` : 'Image upload failed',
      );
    }
  }

  /**
   * Delete an image from Cloudinary by public ID.
   */
  async deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Generate a thumbnail URL from a Cloudinary URL.
   */
  generateThumbnailUrl(imageUrl: string): string {
    return imageUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/');
  }
}
