export declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    city?: string;
    country?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
