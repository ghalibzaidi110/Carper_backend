import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
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
export declare class DamageDetectionService {
    private prisma;
    private configService;
    private httpService;
    private readonly logger;
    private readonly serviceUrl;
    constructor(prisma: PrismaService, configService: ConfigService, httpService: HttpService);
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
            hasDamageDetected: boolean;
            imageUrl: string;
            uploadedAt: Date;
            isCurrent: boolean;
            version: number;
            imageCategory: import("@prisma/client").$Enums.ImageCategory;
            thumbnailUrl: string | null;
            damageDetectionData: import("@prisma/client/runtime/client").JsonValue;
        }[];
    }>;
    private callYoloService;
}
