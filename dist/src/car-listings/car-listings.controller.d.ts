import { CarListingsService } from './car-listings.service';
import { CreateListingDto, UpdateListingDto, UpdateListingStatusDto, ListingFilterDto, ContactSellerDto } from './dto';
export declare class CarListingsController {
    private listingsService;
    constructor(listingsService: CarListingsService);
    findAll(filters: ListingFilterDto): Promise<{
        items: ({
            user: {
                fullName: string;
                city: string | null;
                accountType: import("@prisma/client").$Enums.AccountType;
            };
            car: {
                images: {
                    id: string;
                    imageUrl: string;
                    uploadedAt: Date;
                    isCurrent: boolean;
                    version: number;
                    imageCategory: import("@prisma/client").$Enums.ImageCategory;
                    carId: string;
                    isPermanent: boolean;
                    thumbnailUrl: string | null;
                    cloudinaryPublicId: string | null;
                    fileSize: number | null;
                    fileType: string | null;
                    hasDamageDetected: boolean;
                    damageDetectionData: import("@prisma/client/runtime/client").JsonValue | null;
                }[];
                catalog: {
                    bodyType: string | null;
                    fuelType: string | null;
                    transmission: string | null;
                } | null;
            } & {
                id: string;
                userId: string;
                updatedAt: Date;
                year: number;
                isActive: boolean;
                manufacturer: string;
                modelName: string;
                variant: string | null;
                catalogId: string | null;
                registrationNumber: string;
                vinNumber: string | null;
                color: string | null;
                mileage: number | null;
                condition: import("@prisma/client").$Enums.CarCondition;
                purchaseDate: Date | null;
                purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
                isForResale: boolean;
                registeredAt: Date;
            };
        } & {
            title: string;
            description: string | null;
            id: string;
            userId: string;
            updatedAt: Date;
            listingStatus: import("@prisma/client").$Enums.ListingStatus;
            currency: string;
            carId: string;
            askingPrice: import("@prisma/client-runtime-utils").Decimal;
            isNegotiable: boolean;
            viewCount: number;
            listedAt: Date;
            soldAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        user: {
            createdAt: Date;
            fullName: string;
            city: string | null;
            accountType: import("@prisma/client").$Enums.AccountType;
        };
        car: {
            images: {
                id: string;
                imageUrl: string;
                uploadedAt: Date;
                isCurrent: boolean;
                version: number;
                imageCategory: import("@prisma/client").$Enums.ImageCategory;
                carId: string;
                isPermanent: boolean;
                thumbnailUrl: string | null;
                cloudinaryPublicId: string | null;
                fileSize: number | null;
                fileType: string | null;
                hasDamageDetected: boolean;
                damageDetectionData: import("@prisma/client/runtime/client").JsonValue | null;
            }[];
            catalog: {
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
            } | null;
        } & {
            id: string;
            userId: string;
            updatedAt: Date;
            year: number;
            isActive: boolean;
            manufacturer: string;
            modelName: string;
            variant: string | null;
            catalogId: string | null;
            registrationNumber: string;
            vinNumber: string | null;
            color: string | null;
            mileage: number | null;
            condition: import("@prisma/client").$Enums.CarCondition;
            purchaseDate: Date | null;
            purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
            isForResale: boolean;
            registeredAt: Date;
        };
    } & {
        title: string;
        description: string | null;
        id: string;
        userId: string;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        currency: string;
        carId: string;
        askingPrice: import("@prisma/client-runtime-utils").Decimal;
        isNegotiable: boolean;
        viewCount: number;
        listedAt: Date;
        soldAt: Date | null;
    }>;
    create(userId: string, dto: CreateListingDto): Promise<{
        car: {
            catalog: {
                bodyType: string | null;
                fuelType: string | null;
                transmission: string | null;
                engineCapacity: string | null;
            } | null;
        } & {
            id: string;
            userId: string;
            updatedAt: Date;
            year: number;
            isActive: boolean;
            manufacturer: string;
            modelName: string;
            variant: string | null;
            catalogId: string | null;
            registrationNumber: string;
            vinNumber: string | null;
            color: string | null;
            mileage: number | null;
            condition: import("@prisma/client").$Enums.CarCondition;
            purchaseDate: Date | null;
            purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
            isForResale: boolean;
            registeredAt: Date;
        };
    } & {
        title: string;
        description: string | null;
        id: string;
        userId: string;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        currency: string;
        carId: string;
        askingPrice: import("@prisma/client-runtime-utils").Decimal;
        isNegotiable: boolean;
        viewCount: number;
        listedAt: Date;
        soldAt: Date | null;
    }>;
    getMyListings(userId: string): Promise<({
        car: {
            year: number;
            manufacturer: string;
            modelName: string;
            registrationNumber: string;
            color: string | null;
        };
    } & {
        title: string;
        description: string | null;
        id: string;
        userId: string;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        currency: string;
        carId: string;
        askingPrice: import("@prisma/client-runtime-utils").Decimal;
        isNegotiable: boolean;
        viewCount: number;
        listedAt: Date;
        soldAt: Date | null;
    })[]>;
    update(id: string, userId: string, dto: UpdateListingDto): Promise<{
        title: string;
        description: string | null;
        id: string;
        userId: string;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        currency: string;
        carId: string;
        askingPrice: import("@prisma/client-runtime-utils").Decimal;
        isNegotiable: boolean;
        viewCount: number;
        listedAt: Date;
        soldAt: Date | null;
    }>;
    updateStatus(id: string, userId: string, dto: UpdateListingStatusDto): Promise<{
        title: string;
        description: string | null;
        id: string;
        userId: string;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        currency: string;
        carId: string;
        askingPrice: import("@prisma/client-runtime-utils").Decimal;
        isNegotiable: boolean;
        viewCount: number;
        listedAt: Date;
        soldAt: Date | null;
    }>;
    contactSeller(id: string, dto: ContactSellerDto): Promise<{
        message: string;
    }>;
}
