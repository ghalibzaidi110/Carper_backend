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
export declare class CompleteGoogleSignupDto {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    phoneNumber: string;
    city: string;
    address: string;
    accountType: AccountType;
    businessName?: string;
    businessLicense?: string;
}
