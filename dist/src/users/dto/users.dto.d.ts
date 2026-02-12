import { AccountStatus } from '@prisma/client';
export declare class UpdateProfileDto {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UploadCnicDto {
}
export declare class UpdateUserStatusDto {
    accountStatus: AccountStatus;
}
export declare class VerifyUserDto {
    isVerified: boolean;
}
