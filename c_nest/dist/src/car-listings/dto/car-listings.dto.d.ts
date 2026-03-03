import { ListingStatus } from '@prisma/client';
export declare class CreateListingDto {
    carId: string;
    askingPrice: number;
    title: string;
    description?: string;
    isNegotiable?: boolean;
}
export declare class UpdateListingDto {
    askingPrice?: number;
    title?: string;
    description?: string;
    isNegotiable?: boolean;
}
export declare class UpdateListingStatusDto {
    listingStatus: ListingStatus;
}
export declare class ListingFilterDto {
    manufacturer?: string;
    modelName?: string;
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    condition?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
}
export declare class ContactSellerDto {
    message: string;
    buyerEmail: string;
    buyerName?: string;
}
