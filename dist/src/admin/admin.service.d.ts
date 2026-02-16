import { PrismaService } from '../prisma/prisma.service';
import { AdminUserFilterDto, AdminUpdateUserDto, AdminSendNotificationDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
export declare class AdminService {
    private prisma;
    private notificationsService;
    private emailService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, emailService: EmailService);
    getUsers(filters: AdminUserFilterDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            email: string;
            fullName: string;
            phoneNumber: string | null;
            city: string | null;
            accountType: import("@prisma/client").$Enums.AccountType;
            businessName: string | null;
            accountStatus: import("@prisma/client").$Enums.AccountStatus;
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
    getUserDetail(userId: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        fullName: string;
        phoneNumber: string | null;
        city: string | null;
        address: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        country: string | null;
        businessName: string | null;
        businessLicense: string | null;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        postalCode: string | null;
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
    updateUser(userId: string, dto: AdminUpdateUserDto): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        fullName: string;
        phoneNumber: string | null;
        city: string | null;
        address: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        country: string | null;
        businessName: string | null;
        businessLicense: string | null;
        refreshToken: string | null;
        googleId: string | null;
        facebookId: string | null;
        passwordHash: string | null;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        postalCode: string | null;
        cnicImageUrl: string | null;
        isVerified: boolean;
        avatarUrl: string | null;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
    getPendingVerifications(page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            email: string;
            fullName: string;
            phoneNumber: string | null;
            city: string | null;
            accountType: import("@prisma/client").$Enums.AccountType;
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
    getPlatformStats(): Promise<{
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
