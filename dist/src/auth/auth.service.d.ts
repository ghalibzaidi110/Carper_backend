import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { AccountType } from '@prisma/client';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: any;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    refreshTokens(userId: string, currentRefreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    googleLogin(googleUser: {
        googleId: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    }): Promise<{
        isNewUser: boolean;
        googleData: {
            googleId: string;
            email: string;
            fullName: string;
            avatarUrl: string | undefined;
        };
    } | {
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user: any;
        googleData?: undefined;
    }>;
    completeGoogleSignup(googleData: {
        googleId: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    }, dto: {
        phoneNumber: string;
        city: string;
        address: string;
        accountType: AccountType;
        businessName?: string;
        businessLicense?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: any;
    }>;
    facebookLogin(facebookUser: {
        facebookId: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    private generateTokens;
    private updateRefreshToken;
    private sanitizeUser;
}
