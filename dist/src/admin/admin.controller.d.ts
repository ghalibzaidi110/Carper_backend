import { AdminService } from './admin.service';
import { AdminUserFilterDto, AdminUpdateUserDto, AdminSendNotificationDto } from './dto';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getUsers(filters: AdminUserFilterDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            email: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            accountStatus: import("@prisma/client").$Enums.AccountStatus;
            fullName: string;
            phoneNumber: string | null;
            city: string | null;
            businessName: string | null;
            cnicImageUrl: string | null;
            isVerified: boolean;
            avatarUrl: string | null;
            lastLogin: Date | null;
            _count: {
                cars: number;
                listings: number;
                rentals: number;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUserDetail(id: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        accountType: import("@prisma/client").$Enums.AccountType;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        fullName: string;
        phoneNumber: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        postalCode: string | null;
        businessName: string | null;
        businessLicense: string | null;
        cnicImageUrl: string | null;
        isVerified: boolean;
        avatarUrl: string | null;
        lastLogin: Date | null;
        _count: {
            notifications: number;
            cars: number;
            listings: number;
            rentals: number;
        };
    }>;
    updateUser(id: string, dto: AdminUpdateUserDto): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        googleId: string | null;
        facebookId: string | null;
        passwordHash: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        fullName: string;
        phoneNumber: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        postalCode: string | null;
        businessName: string | null;
        businessLicense: string | null;
        cnicImageUrl: string | null;
        isVerified: boolean;
        avatarUrl: string | null;
        refreshToken: string | null;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
    getPendingVerifications(page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            email: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            fullName: string;
            phoneNumber: string | null;
            city: string | null;
            cnicImageUrl: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    sendNotification(dto: AdminSendNotificationDto): Promise<{
        message: string;
    }>;
    getStats(): Promise<{
        users: {
            total: number;
            individuals: number;
            rentalBusinesses: number;
            suspended: number;
            pendingVerifications: number;
        };
        cars: {
            total: number;
        };
        listings: {
            total: number;
            active: number;
        };
        rentals: {
            total: number;
            active: number;
        };
    }>;
}
