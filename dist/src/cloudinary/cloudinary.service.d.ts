import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';
export declare class CloudinaryService {
    private configService;
    constructor(configService: ConfigService);
    uploadImage(file: Express.Multer.File, folder: string, maxSizeMB?: number): Promise<UploadApiResponse>;
    uploadMultipleImages(files: Express.Multer.File[], folder: string): Promise<UploadApiResponse[]>;
    deleteImage(publicId: string): Promise<any>;
    generateThumbnailUrl(imageUrl: string): string;
}
