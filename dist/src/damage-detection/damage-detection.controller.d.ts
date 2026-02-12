import { DamageDetectionService } from './damage-detection.service';
import { RunDetectionDto, RunDetectionOnCarDto } from './dto';
export declare class DamageDetectionController {
    private detectionService;
    constructor(detectionService: DamageDetectionService);
    detectOnImage(dto: RunDetectionDto, userId: string): Promise<import("./damage-detection.service").DamageDetectionResult>;
    detectOnCar(dto: RunDetectionOnCarDto, userId: string): Promise<{
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
            imageUrl: string;
            uploadedAt: Date;
            isCurrent: boolean;
            version: number;
            imageCategory: import("@prisma/client").$Enums.ImageCategory;
            thumbnailUrl: string | null;
            hasDamageDetected: boolean;
            damageDetectionData: import("@prisma/client/runtime/client").JsonValue;
        }[];
    }>;
}
