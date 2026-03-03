export declare class CreateCatalogDto {
    manufacturer: string;
    modelName: string;
    year: number;
    variant?: string;
    bodyType?: string;
    fuelType?: string;
    transmission?: string;
    engineCapacity?: string;
    seatingCapacity?: number;
    basePrice: number;
    description?: string;
    features?: string[];
}
export declare class UpdateCatalogDto {
    manufacturer?: string;
    modelName?: string;
    year?: number;
    variant?: string;
    bodyType?: string;
    fuelType?: string;
    transmission?: string;
    engineCapacity?: string;
    seatingCapacity?: number;
    basePrice?: number;
    description?: string;
    features?: string[];
    isActive?: boolean;
}
export declare class CatalogFilterDto {
    manufacturer?: string;
    modelName?: string;
    year?: number;
    bodyType?: string;
    fuelType?: string;
    page?: number;
    limit?: number;
}
