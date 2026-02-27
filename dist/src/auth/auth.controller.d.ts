import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, CompleteGoogleSignupDto } from './dto';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private authService;
    private configService;
    constructor(authService: AuthService, configService: ConfigService);
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
    refreshTokens(dto: RefreshTokenDto, user: any): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    googleAuth(): Promise<void>;
    googleAuthCallback(req: Request, res: Response): Promise<void>;
    completeGoogleSignup(dto: CompleteGoogleSignupDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: any;
    }>;
    getMe(user: any): Promise<any>;
}
