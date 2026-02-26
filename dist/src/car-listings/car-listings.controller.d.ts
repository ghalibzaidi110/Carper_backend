import { CarListingsService } from './car-listings.service';
import { CreateListingDto, UpdateListingDto, UpdateListingStatusDto, ListingFilterDto, ContactSellerDto } from './dto';
export declare class CarListingsController {
    private listingsService;
    constructor(listingsService: CarListingsService);
    findAll(filters: ListingFilterDto): Promise<{
        items: ({
            user: {
                accountType: import("@prisma/client").$Enums.AccountType;
                fullName: string;
                city: string | null;
            };
            car: {
                catalog: {
                    bodyType: string | null;
                    fuelType: string | null;
                    transmission: string | null;
                } | null;
                images: {
                    id: string;
                    hasDamageDetected: boolean;
                    carId: string;
                    imageUrl: string;
                    uploadedAt: Date;
                    isCurrent: boolean;
                    version: number;
                    imageCategory: import("@prisma/client").$Enums.ImageCategory;
                    isPermanent: boolean;
                    thumbnailUrl: string | null;
                    cloudinaryPublicId: string | null;
                    fileSize: number | null;
                    fileType: string | null;
                    damageDetectionData: import("@prisma/client/runtime/client").JsonValue | null;
                }[];
            } & {
                id: string;
                userId: string;
                updatedAt: Date;
                year: number;
                isActive: boolean;
                catalogId: string | null;
                registrationNumber: string;
                vinNumber: string | null;
                manufacturer: string;
                modelName: string;
                variant: string | null;
                color: string | null;
                mileage: number | null;
                condition: import("@prisma/client").$Enums.CarCondition;
                purchaseDate: Date | null;
                purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
                isForResale: boolean;
                registeredAt: Date;
            };
        } & {
            id: string;
            title: string;
            userId: string;
            description: string | null;
            updatedAt: Date;
            listingStatus: import("@prisma/client").$Enums.ListingStatus;
            carId: string;
            currency: string;
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
            accountType: import("@prisma/client").$Enums.AccountType;
            fullName: string;
            city: string | null;
        };
        car: {
            catalog: {
                id: string;
                createdAt: Date;
                description: string | null;
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
            } | null;
            images: {
                id: string;
                hasDamageDetected: boolean;
                carId: string;
                imageUrl: string;
                uploadedAt: Date;
                isCurrent: boolean;
                version: number;
                imageCategory: import("@prisma/client").$Enums.ImageCategory;
                isPermanent: boolean;
                thumbnailUrl: string | null;
                cloudinaryPublicId: string | null;
                fileSize: number | null;
                fileType: string | null;
                damageDetectionData: import("@prisma/client/runtime/client").JsonValue | null;
            }[];
        } & {
            id: string;
            userId: string;
            updatedAt: Date;
            year: number;
            isActive: boolean;
            catalogId: string | null;
            registrationNumber: string;
            vinNumber: string | null;
            manufacturer: string;
            modelName: string;
            variant: string | null;
            color: string | null;
            mileage: number | null;
            condition: import("@prisma/client").$Enums.CarCondition;
            purchaseDate: Date | null;
            purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
            isForResale: boolean;
            registeredAt: Date;
        };
    } & {
        id: string;
        title: string;
        userId: string;
        description: string | null;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        carId: string;
        currency: string;
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
            catalogId: string | null;
            registrationNumber: string;
            vinNumber: string | null;
            manufacturer: string;
            modelName: string;
            variant: string | null;
            color: string | null;
            mileage: number | null;
            condition: import("@prisma/client").$Enums.CarCondition;
            purchaseDate: Date | null;
            purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
            isForResale: boolean;
            registeredAt: Date;
        };
    } & {
        id: string;
        title: string;
        userId: string;
        description: string | null;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        carId: string;
        currency: string;
        askingPrice: import("@prisma/client-runtime-utils").Decimal;
        isNegotiable: boolean;
        viewCount: number;
        listedAt: Date;
        soldAt: Date | null;
    }>;
    getMyListings(userId: string): Promise<({
        car: {
            year: number;
            registrationNumber: string;
            manufacturer: string;
            modelName: string;
            color: string | null;
        };
    } & {
        id: string;
        title: string;
        userId: string;
        description: string | null;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        carId: string;
        currency: string;
        askingPrice: import("@prisma/client-runtime-utils").Decimal;
        isNegotiable: boolean;
        viewCount: number;
        listedAt: Date;
        soldAt: Date | null;
    })[]>;
    update(id: string, userId: string, dto: UpdateListingDto): Promise<{
        id: string;
        title: string;
        userId: string;
        description: string | null;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        carId: string;
        currency: string;
        askingPrice: import("@prisma/client-runtime-utils").Decimal;
        isNegotiable: boolean;
        viewCount: number;
        listedAt: Date;
        soldAt: Date | null;
    }>;
    updateStatus(id: string, userId: string, dto: UpdateListingStatusDto): Promise<{
        id: string;
        title: string;
        userId: string;
        description: string | null;
        updatedAt: Date;
        listingStatus: import("@prisma/client").$Enums.ListingStatus;
        carId: string;
        currency: string;
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
