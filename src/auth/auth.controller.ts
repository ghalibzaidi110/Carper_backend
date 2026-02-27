import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, CompleteGoogleSignupDto } from './dto';
import { JwtAuthGuard, JwtRefreshGuard, GoogleAuthGuard, FacebookAuthGuard } from './guards';
import { GoogleAuthCheckGuard } from './guards/google-auth-check.guard';
import { Public, CurrentUser } from '../common/decorators';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user account',
    description: 'Create a new account with email and password. Choose account type: INDIVIDUAL or CAR_RENTAL. All fields are required.'
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login with email and password',
    description: 'Authenticate user and receive access & refresh tokens'
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshTokens(@Body() dto: RefreshTokenDto, @CurrentUser() user: any) {
    return this.authService.refreshTokens(user.id, user.currentRefreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  // ─── GOOGLE OAUTH ────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthCheckGuard, GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthCheckGuard, GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user as any);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if (result.isNewUser) {
      // New user - redirect to signup page with Google data
      const googleData = encodeURIComponent(JSON.stringify(result.googleData));
      res.redirect(
        `${frontendUrl}/auth/signup?google=true&data=${googleData}`,
      );
    } else {
      // Existing user - redirect with tokens
      const existingUserResult = result as { accessToken: string; refreshToken: string; isNewUser: false; user: any };
      res.redirect(
        `${frontendUrl}/auth/callback?accessToken=${existingUserResult.accessToken}&refreshToken=${existingUserResult.refreshToken}`,
      );
    }
  }

  @Public()
  @Post('google/complete-signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Complete signup after Google OAuth',
    description: 'After Google OAuth redirects to signup page, user completes registration with additional required fields (phone, city, address, account type)'
  })
  async completeGoogleSignup(@Body() dto: CompleteGoogleSignupDto) {
    // Extract Google data and additional fields
    const { googleId, email, fullName, avatarUrl, phoneNumber, city, address, accountType, businessName, businessLicense } = dto;
    
    return this.authService.completeGoogleSignup(
      { googleId, email, fullName, avatarUrl },
      { phoneNumber, city, address, accountType, businessName, businessLicense },
    );
  }

  // ─── FACEBOOK OAUTH (DISABLED) ────────────────────────────────

  // @Public()
  // @Get('facebook')
  // @UseGuards(FacebookAuthGuard)
  // @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  // async facebookAuth() {
  //   // Guard redirects to Facebook
  // }

  // @Public()
  // @Get('facebook/callback')
  // @UseGuards(FacebookAuthGuard)
  // @ApiOperation({ summary: 'Facebook OAuth callback' })
  // async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
  //   const result = await this.authService.facebookLogin(req.user as any);
  //   const frontendUrl = this.configService.get<string>('FRONTEND_URL');
  //   res.redirect(
  //     `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
  //   );
  // }

  // ─── ME ────────────────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
