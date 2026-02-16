import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { AccountType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ─── REGISTER (Email/Password) ────────────────────────────────

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email address is already registered');
    }

    // Check if phone number already exists
    const existingPhone = await this.prisma.user.findFirst({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    // Validate business fields for CAR_RENTAL accounts
    if (dto.accountType === AccountType.CAR_RENTAL) {
      if (!dto.businessName || dto.businessName.trim().length < 3) {
        throw new BadRequestException(
          'Business name is required and must be at least 3 characters for CAR_RENTAL accounts'
        );
      }
    }

    // Hash password with strong algorithm
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Set default country if not provided
    const country = dto.country || 'Pakistan';

    // Create user with all required fields
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        city: dto.city,
        address: dto.address,
        country,
        accountType: dto.accountType,
        businessName: dto.businessName,
        businessLicense: dto.businessLicense,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.accountType);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: 'Registration successful',
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ─── LOGIN (Email/Password) ───────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended or deleted');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.accountType);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────

  async refreshTokens(userId: string, currentRefreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    // Verify refresh token matches stored hash
    const refreshTokenMatches = await bcrypt.compare(
      currentRefreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.accountType);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // ─── LOGOUT ───────────────────────────────────────────────────

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  // ─── GOOGLE OAUTH ─────────────────────────────────────────────

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }) {
    if (!googleUser.email) {
      throw new BadRequestException('Google account must have an email');
    }

    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      // Check if email already exists (link accounts)
      user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Link Google ID to existing account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            avatarUrl: user.avatarUrl || googleUser.avatarUrl,
          },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.googleId,
            fullName: googleUser.fullName,
            avatarUrl: googleUser.avatarUrl,
            accountType: AccountType.INDIVIDUAL,
          },
        });
      }
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended or deleted');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.accountType);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ─── FACEBOOK OAUTH ───────────────────────────────────────────

  async facebookLogin(facebookUser: {
    facebookId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }) {
    if (!facebookUser.email) {
      throw new BadRequestException('Facebook account must have an email');
    }

    let user = await this.prisma.user.findUnique({
      where: { facebookId: facebookUser.facebookId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: facebookUser.email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            facebookId: facebookUser.facebookId,
            avatarUrl: user.avatarUrl || facebookUser.avatarUrl,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: facebookUser.email,
            facebookId: facebookUser.facebookId,
            fullName: facebookUser.fullName,
            avatarUrl: facebookUser.avatarUrl,
            accountType: AccountType.INDIVIDUAL,
          },
        });
      }
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended or deleted');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.accountType);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ─── HELPER METHODS ───────────────────────────────────────────

  private async generateTokens(userId: string, email: string, accountType: AccountType) {
    const payload = { sub: userId, email, accountType };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, ...sanitized } = user;
    return sanitized;
  }
}
