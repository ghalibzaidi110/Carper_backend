import { AccountType } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    city: string;
    address: string;
    accountType: AccountType;
    country?: string;
    businessName?: string;
    businessLicense?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
