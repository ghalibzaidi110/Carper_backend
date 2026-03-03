import { CarCondition } from '@prisma/client';
export declare class RegisterCarDto {
    catalogId: string;
    registrationNumber: string;
    vinNumber?: string;
    color?: string;
    mileage?: number;
    condition?: CarCondition;
    purchaseDate?: string;
    purchasePrice?: number;
}
export declare class UpdateCarDto {
    color?: string;
    mileage?: number;
    condition?: CarCondition;
}
export declare class CarFilterDto {
    manufacturer?: string;
    modelName?: string;
    year?: number;
    page?: number;
    limit?: number;
}
