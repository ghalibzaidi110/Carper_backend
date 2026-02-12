import { AccountStatus, AccountType } from '@prisma/client';
export declare class AdminUserFilterDto {
    accountType?: AccountType;
    accountStatus?: AccountStatus;
    isVerified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class AdminUpdateUserDto {
    accountStatus?: AccountStatus;
    accountType?: AccountType;
    isVerified?: boolean;
}
export declare class AdminSendNotificationDto {
    title: string;
    message: string;
    sendToAll?: boolean;
    userIds?: string[];
}
