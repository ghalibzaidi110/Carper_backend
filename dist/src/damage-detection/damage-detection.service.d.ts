import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export interface DamageDetectionResult {
    hasDamage: boolean;
    confidence: number;
    detections: Array<{
        label: string;
        confidence: number;
        bbox: [number, number, number, number];
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
export declare class DamageDetectionService {
    private prisma;
    private configService;
    private httpService;
    private cloudinaryService;
    private readonly logger;
    private readonly serviceUrl;
    constructor(prisma: PrismaService, configService: ConfigService, httpService: HttpService, cloudinaryService: CloudinaryService);
    scanByUpload(files: Express.Multer.File[]): Promise<ScanByUploadResponse>;
    private buildProcessedImageUrl;
    private getDummyDetectionResult;
    private getSeverity;
    private isPythonServiceAvailable;
    detectOnImage(imageId: string, userId: string): Promise<DamageDetectionResult>;
    detectOnCar(carId: string, userId: string): Promise<{
        carId: string;
        registrationNumber: string;
        totalImagesScanned: number;
        imagesWithDamage: number;
        results: ({
            hasDamage: boolean;
            confidence: number;
            detections: Array<{
                label: string;
                confidence: number;
                bbox: [number, number, number, number];
            }>;
            processedImageUrl?: string;
            imageId: string;
            category: import("@prisma/client").$Enums.ImageCategory;
            error?: undefined;
        } | {
            imageId: string;
            category: import("@prisma/client").$Enums.ImageCategory;
            hasDamage: boolean;
            confidence: number;
            detections: never[];
            error: any;
        })[];
    }>;
    getDamageHistory(carId: string, userId: string): Promise<{
        carId: string;
        registrationNumber: string;
        totalDamageRecords: number;
        records: {
            id: string;
            imageCategory: import("@prisma/client").$Enums.ImageCategory;
            imageUrl: string;
            thumbnailUrl: string | null;
            version: number;
            isCurrent: boolean;
            hasDamageDetected: boolean;
            damageDetectionData: import("@prisma/client/runtime/client").JsonValue;
            uploadedAt: Date;
        }[];
    }>;
    private callYoloService;
}
