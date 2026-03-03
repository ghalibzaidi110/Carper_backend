import { AccountStatus } from '@prisma/client';
export declare class UpdateProfileDto {
    fullName?: string;
    phoneNumber?: string;
    city?: string;
    address?: string;
    avatarUrl?: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UpdateUserStatusDto {
    accountStatus: AccountStatus;
}
export declare class VerifyUserDto {
    isVerified: boolean;
}
