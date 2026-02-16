import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
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
        accessToken: string;
        refreshToken: string;
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
