import { RentalsService } from './rentals.service';
import { CreateRentalDto, CompleteRentalDto, RentalFilterDto } from './dto';
export declare class RentalsController {
    private rentalsService;
    constructor(rentalsService: RentalsService);
    create(userId: string, dto: CreateRentalDto): Promise<{
        car: {
            year: number;
            manufacturer: string;
            modelName: string;
            registrationNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        currency: string;
        status: import("@prisma/client").$Enums.RentalStatus;
        carId: string;
        renterName: string;
        renterPhone: string | null;
        renterEmail: string | null;
        renterCnic: string | null;
        startDate: Date;
        endDate: Date;
        actualReturnDate: Date | null;
        mileageAtStart: number | null;
        mileageAtEnd: number | null;
        preRentalNotes: string | null;
        postRentalNotes: string | null;
        damageCharges: import("@prisma/client-runtime-utils").Decimal | null;
        damageDescription: string | null;
        rentalPrice: import("@prisma/client-runtime-utils").Decimal;
        totalCharges: import("@prisma/client-runtime-utils").Decimal | null;
        preInspectionVersion: number | null;
        postInspectionVersion: number | null;
    }>;
    findAll(userId: string, filters: RentalFilterDto): Promise<{
        data: ({
            car: {
                year: number;
                manufacturer: string;
                modelName: string;
                registrationNumber: string;
                color: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            currency: string;
            status: import("@prisma/client").$Enums.RentalStatus;
            carId: string;
            renterName: string;
            renterPhone: string | null;
            renterEmail: string | null;
            renterCnic: string | null;
            startDate: Date;
            endDate: Date;
            actualReturnDate: Date | null;
            mileageAtStart: number | null;
            mileageAtEnd: number | null;
            preRentalNotes: string | null;
            postRentalNotes: string | null;
            damageCharges: import("@prisma/client-runtime-utils").Decimal | null;
            damageDescription: string | null;
            rentalPrice: import("@prisma/client-runtime-utils").Decimal;
            totalCharges: import("@prisma/client-runtime-utils").Decimal | null;
            preInspectionVersion: number | null;
            postInspectionVersion: number | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(userId: string): Promise<{
        activeRentals: number;
        completedRentals: number;
        totalRentals: number;
        totalRevenue: number | import("@prisma/client-runtime-utils").Decimal;
    }>;
    findOne(id: string, userId: string): Promise<{
        car: {
            id: string;
            year: number;
            manufacturer: string;
            modelName: string;
            registrationNumber: string;
            color: string | null;
            mileage: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        currency: string;
        status: import("@prisma/client").$Enums.RentalStatus;
        carId: string;
        renterName: string;
        renterPhone: string | null;
        renterEmail: string | null;
        renterCnic: string | null;
        startDate: Date;
        endDate: Date;
        actualReturnDate: Date | null;
        mileageAtStart: number | null;
        mileageAtEnd: number | null;
        preRentalNotes: string | null;
        postRentalNotes: string | null;
        damageCharges: import("@prisma/client-runtime-utils").Decimal | null;
        damageDescription: string | null;
        rentalPrice: import("@prisma/client-runtime-utils").Decimal;
        totalCharges: import("@prisma/client-runtime-utils").Decimal | null;
        preInspectionVersion: number | null;
        postInspectionVersion: number | null;
    }>;
    complete(id: string, userId: string, dto: CompleteRentalDto): Promise<{
        car: {
            manufacturer: string;
            modelName: string;
            registrationNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        currency: string;
        status: import("@prisma/client").$Enums.RentalStatus;
        carId: string;
        renterName: string;
        renterPhone: string | null;
        renterEmail: string | null;
        renterCnic: string | null;
        startDate: Date;
        endDate: Date;
        actualReturnDate: Date | null;
        mileageAtStart: number | null;
        mileageAtEnd: number | null;
        preRentalNotes: string | null;
        postRentalNotes: string | null;
        damageCharges: import("@prisma/client-runtime-utils").Decimal | null;
        damageDescription: string | null;
        rentalPrice: import("@prisma/client-runtime-utils").Decimal;
        totalCharges: import("@prisma/client-runtime-utils").Decimal | null;
        preInspectionVersion: number | null;
        postInspectionVersion: number | null;
    }>;
    cancel(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        currency: string;
        status: import("@prisma/client").$Enums.RentalStatus;
        carId: string;
        renterName: string;
        renterPhone: string | null;
        renterEmail: string | null;
        renterCnic: string | null;
        startDate: Date;
        endDate: Date;
        actualReturnDate: Date | null;
        mileageAtStart: number | null;
        mileageAtEnd: number | null;
        preRentalNotes: string | null;
        postRentalNotes: string | null;
        damageCharges: import("@prisma/client-runtime-utils").Decimal | null;
        damageDescription: string | null;
        rentalPrice: import("@prisma/client-runtime-utils").Decimal;
        totalCharges: import("@prisma/client-runtime-utils").Decimal | null;
        preInspectionVersion: number | null;
        postInspectionVersion: number | null;
    }>;
}
