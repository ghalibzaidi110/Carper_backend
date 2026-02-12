import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ─── GET PROFILE ──────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        accountType: true,
        accountStatus: true,
        fullName: true,
        phoneNumber: true,
        address: true,
        city: true,
        country: true,
        postalCode: true,
        businessName: true,
        businessLicense: true,
        cnicImageUrl: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ─── UPDATE PROFILE ───────────────────────────────────────────

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        address: true,
        city: true,
        country: true,
        postalCode: true,
      },
    });

    return user;
  }

  // ─── CHANGE PASSWORD ──────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException(
        'Cannot change password for OAuth-only accounts',
      );
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }

  // ─── UPLOAD CNIC ──────────────────────────────────────────────

  async uploadCnic(userId: string, cnicImageUrl: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { cnicImageUrl },
    });

    return { message: 'CNIC image uploaded. Awaiting admin verification.' };
  }

  // ─── GET USER DASHBOARD STATS ─────────────────────────────────

  async getDashboardStats(userId: string) {
    const [totalCars, activeListing, totalRentals] = await Promise.all([
      this.prisma.userCar.count({ where: { userId, isActive: true } }),
      this.prisma.carListing.count({
        where: { userId, listingStatus: 'ACTIVE' },
      }),
      this.prisma.rental.count({ where: { userId } }),
    ]);

    return {
      totalCars,
      activeListing,
      totalRentals,
    };
  }
}
