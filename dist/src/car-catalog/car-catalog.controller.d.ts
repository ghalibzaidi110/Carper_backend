import { CarCatalogService } from './car-catalog.service';
import { CreateCatalogDto, UpdateCatalogDto, CatalogFilterDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class CarCatalogController {
    private catalogService;
    private cloudinaryService;
    constructor(catalogService: CarCatalogService, cloudinaryService: CloudinaryService);
    findAll(filters: CatalogFilterDto): Promise<{
        items: ({
            images: {
                id: string;
                catalogId: string;
                isPrimary: boolean;
                imageUrl: string;
                imageOrder: number;
                altText: string | null;
                uploadedAt: Date;
            }[];
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            year: number;
            isActive: boolean;
            manufacturer: string;
            modelName: string;
            variant: string | null;
            currency: string;
            bodyType: string | null;
            fuelType: string | null;
            transmission: string | null;
            engineCapacity: string | null;
            seatingCapacity: number | null;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            features: import("@prisma/client/runtime/client").JsonValue | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getManufacturers(): Promise<string[]>;
    getModelsByManufacturer(manufacturer: string): Promise<{
        id: string;
        year: number;
        modelName: string;
        variant: string | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
    }[]>;
    findOne(id: string): Promise<{
        images: {
            id: string;
            catalogId: string;
            isPrimary: boolean;
            imageUrl: string;
            imageOrder: number;
            altText: string | null;
            uploadedAt: Date;
        }[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        isActive: boolean;
        manufacturer: string;
        modelName: string;
        variant: string | null;
        currency: string;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        features: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    create(dto: CreateCatalogDto): Promise<{
        images: {
            id: string;
            catalogId: string;
            isPrimary: boolean;
            imageUrl: string;
            imageOrder: number;
            altText: string | null;
            uploadedAt: Date;
        }[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        isActive: boolean;
        manufacturer: string;
        modelName: string;
        variant: string | null;
        currency: string;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        features: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    bulkCreate(entries: CreateCatalogDto[]): Promise<{
        count: number;
        entries: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            year: number;
            isActive: boolean;
            manufacturer: string;
            modelName: string;
            variant: string | null;
            currency: string;
            bodyType: string | null;
            fuelType: string | null;
            transmission: string | null;
            engineCapacity: string | null;
            seatingCapacity: number | null;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            features: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
    }>;
    update(id: string, dto: UpdateCatalogDto): Promise<{
        images: {
            id: string;
            catalogId: string;
            isPrimary: boolean;
            imageUrl: string;
            imageOrder: number;
            altText: string | null;
            uploadedAt: Date;
        }[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        isActive: boolean;
        manufacturer: string;
        modelName: string;
        variant: string | null;
        currency: string;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        features: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        isActive: boolean;
        manufacturer: string;
        modelName: string;
        variant: string | null;
        currency: string;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        features: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    uploadImage(catalogId: string, file: Express.Multer.File, isPrimary: string, altText: string): Promise<{
        id: string;
        catalogId: string;
        isPrimary: boolean;
        imageUrl: string;
        imageOrder: number;
        altText: string | null;
        uploadedAt: Date;
    }>;
}
