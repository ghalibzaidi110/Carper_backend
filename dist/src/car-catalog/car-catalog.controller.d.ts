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
                isPrimary: boolean;
                catalogId: string;
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
            manufacturer: string;
            modelName: string;
            year: number;
            variant: string | null;
            bodyType: string | null;
            fuelType: string | null;
            transmission: string | null;
            engineCapacity: string | null;
            seatingCapacity: number | null;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            features: import("@prisma/client/runtime/client").JsonValue | null;
            isActive: boolean;
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
        modelName: string;
        year: number;
        variant: string | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
    }[]>;
    findOne(id: string): Promise<{
        images: {
            id: string;
            isPrimary: boolean;
            catalogId: string;
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
        manufacturer: string;
        modelName: string;
        year: number;
        variant: string | null;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
    }>;
    create(dto: CreateCatalogDto): Promise<{
        images: {
            id: string;
            isPrimary: boolean;
            catalogId: string;
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
        manufacturer: string;
        modelName: string;
        year: number;
        variant: string | null;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
    }>;
    bulkCreate(entries: CreateCatalogDto[]): Promise<{
        count: number;
        entries: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            manufacturer: string;
            modelName: string;
            year: number;
            variant: string | null;
            bodyType: string | null;
            fuelType: string | null;
            transmission: string | null;
            engineCapacity: string | null;
            seatingCapacity: number | null;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            features: import("@prisma/client/runtime/client").JsonValue | null;
            isActive: boolean;
        }[];
    }>;
    bulkImport(file: Express.Multer.File, validateOnly?: string): Promise<{
        totalRows: any;
        successful: number;
        failed: number;
        errors: {
            row: number;
            error: string;
        }[];
        importedEntries: any[];
    }>;
    update(id: string, dto: UpdateCatalogDto): Promise<{
        images: {
            id: string;
            isPrimary: boolean;
            catalogId: string;
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
        manufacturer: string;
        modelName: string;
        year: number;
        variant: string | null;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        manufacturer: string;
        modelName: string;
        year: number;
        variant: string | null;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
    }>;
    uploadImage(catalogId: string, file: Express.Multer.File, isPrimary: string, altText: string): Promise<{
        id: string;
        isPrimary: boolean;
        catalogId: string;
        imageUrl: string;
        imageOrder: number;
        altText: string | null;
        uploadedAt: Date;
    }>;
}
