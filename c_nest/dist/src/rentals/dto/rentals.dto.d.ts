import { RentalStatus } from '@prisma/client';
export declare class CreateRentalDto {
    carId: string;
    renterName: string;
    renterPhone?: string;
    renterEmail?: string;
    renterCnic?: string;
    startDate: string;
    endDate: string;
    mileageAtStart?: number;
    preRentalNotes?: string;
    rentalPrice: number;
}
export declare class CompleteRentalDto {
    mileageAtEnd?: number;
    postRentalNotes?: string;
    damageCharges?: number;
    damageDescription?: string;
    totalCharges?: number;
}
export declare class UpdateRentalStatusDto {
    status: RentalStatus;
}
export declare class RentalFilterDto {
    status?: RentalStatus;
    carId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
}
