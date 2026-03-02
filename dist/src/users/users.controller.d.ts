import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class UsersController {
    private usersService;
    private cloudinaryService;
    constructor(usersService: UsersService, cloudinaryService: CloudinaryService);
    getProfile(userId: string): Promise<{
        id: string;
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
        createdAt: Date;
        lastLogin: Date | null;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        accountType: import("@prisma/client").$Enums.AccountType;
        fullName: string;
        phoneNumber: string | null;
        address: string | null;
        city: string | null;
        avatarUrl: string | null;
        updatedAt: Date;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    uploadCnic(userId: string, file: Express.Multer.File): Promise<{
        message: string;
        cnicImageUrl: string;
    }>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<{
        message: string;
        avatarUrl: string;
    }>;
    getDashboardStats(userId: string): Promise<any>;
}
