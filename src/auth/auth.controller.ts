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
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard, JwtRefreshGuard, GoogleAuthGuard, FacebookAuthGuard } from './guards';
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

  // ─── GOOGLE OAUTH (DISABLED) ─────────────────────────────────
  // Uncomment and configure when OAuth is needed

  // @Public()
  // @Get('google')
  // @UseGuards(GoogleAuthGuard)
  // @ApiOperation({ summary: 'Initiate Google OAuth login' })
  // async googleAuth() {
  //   // Guard redirects to Google
  // }

  // @Public()
  // @Get('google/callback')
  // @UseGuards(GoogleAuthGuard)
  // @ApiOperation({ summary: 'Google OAuth callback' })
  // async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
  //   const result = await this.authService.googleLogin(req.user as any);
  //   const frontendUrl = this.configService.get<string>('FRONTEND_URL');
  //   // Redirect to frontend with tokens as query params
  //   res.redirect(
  //     `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
  //   );
  // }

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
