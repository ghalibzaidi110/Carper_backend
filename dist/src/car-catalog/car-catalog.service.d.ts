import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogDto, UpdateCatalogDto, CatalogFilterDto } from './dto';
export declare class CarCatalogService {
    private prisma;
    constructor(prisma: PrismaService);
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
        year: number;
        isActive: boolean;
        manufacturer: string;
        modelName: string;
        variant: string | null;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        currency: string;
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
            bodyType: string | null;
            fuelType: string | null;
            transmission: string | null;
            engineCapacity: string | null;
            seatingCapacity: number | null;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            features: import("@prisma/client/runtime/client").JsonValue | null;
            currency: string;
        }[];
    }>;
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
            year: number;
            isActive: boolean;
            manufacturer: string;
            modelName: string;
            variant: string | null;
            bodyType: string | null;
            fuelType: string | null;
            transmission: string | null;
            engineCapacity: string | null;
            seatingCapacity: number | null;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            features: import("@prisma/client/runtime/client").JsonValue | null;
            currency: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
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
        year: number;
        isActive: boolean;
        manufacturer: string;
        modelName: string;
        variant: string | null;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        currency: string;
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
        year: number;
        isActive: boolean;
        manufacturer: string;
        modelName: string;
        variant: string | null;
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        currency: string;
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
        bodyType: string | null;
        fuelType: string | null;
        transmission: string | null;
        engineCapacity: string | null;
        seatingCapacity: number | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        currency: string;
    }>;
    addImage(catalogId: string, imageUrl: string, isPrimary?: boolean, altText?: string): Promise<{
        id: string;
        isPrimary: boolean;
        catalogId: string;
        imageUrl: string;
        imageOrder: number;
        altText: string | null;
        uploadedAt: Date;
    }>;
    getManufacturers(): Promise<string[]>;
    getModelsByManufacturer(manufacturer: string): Promise<{
        id: string;
        year: number;
        modelName: string;
        variant: string | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
    }[]>;
}
