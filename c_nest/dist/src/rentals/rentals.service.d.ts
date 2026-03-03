import { PrismaService } from '../prisma/prisma.service';
import { CreateRentalDto, CompleteRentalDto, RentalFilterDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class RentalsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    create(userId: string, dto: CreateRentalDto): Promise<{
        car: {
            year: number;
            registrationNumber: string;
            manufacturer: string;
            modelName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
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
        currency: string;
        preInspectionVersion: number | null;
        postInspectionVersion: number | null;
    }>;
    findAll(userId: string, filters: RentalFilterDto): Promise<{
        data: ({
            car: {
                year: number;
                registrationNumber: string;
                manufacturer: string;
                modelName: string;
                color: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
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
            currency: string;
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
    findOne(id: string, userId: string): Promise<{
        car: {
            id: string;
            year: number;
            registrationNumber: string;
            manufacturer: string;
            modelName: string;
            color: string | null;
            mileage: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
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
        currency: string;
        preInspectionVersion: number | null;
        postInspectionVersion: number | null;
    }>;
    completeRental(id: string, userId: string, dto: CompleteRentalDto): Promise<{
        car: {
            registrationNumber: string;
            manufacturer: string;
            modelName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
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
        currency: string;
        preInspectionVersion: number | null;
        postInspectionVersion: number | null;
    }>;
    cancelRental(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
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
        currency: string;
        preInspectionVersion: number | null;
        postInspectionVersion: number | null;
    }>;
    getBusinessStats(userId: string): Promise<{
        activeRentals: number;
        completedRentals: number;
        totalRentals: number;
        totalRevenue: number | import("@prisma/client-runtime-utils").Decimal;
    }>;
}
