import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class UsersController {
    private usersService;
    private cloudinaryService;
    constructor(usersService: UsersService, cloudinaryService: CloudinaryService);
    getProfile(userId: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        fullName: string;
        phoneNumber: string | null;
        city: string | null;
        country: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        address: string | null;
        postalCode: string | null;
        businessName: string | null;
        businessLicense: string | null;
        cnicImageUrl: string | null;
        isVerified: boolean;
        avatarUrl: string | null;
        lastLogin: Date | null;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        phoneNumber: string | null;
        city: string | null;
        country: string | null;
        address: string | null;
        postalCode: string | null;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    uploadCnic(userId: string, file: Express.Multer.File): Promise<{
        message: string;
    }>;
    getDashboardStats(userId: string): Promise<{
        totalCars: number;
        activeListing: number;
        totalRentals: number;
    }>;
}
