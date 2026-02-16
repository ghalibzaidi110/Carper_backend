import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
    // Check phone uniqueness if phone is being updated
    if (dto.phoneNumber) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phoneNumber: dto.phoneNumber,
          id: { not: userId }, // Exclude current user
        },
      });

      if (existingPhone) {
        throw new ConflictException(
          'Phone number is already registered by another user',
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        accountType: true,
        fullName: true,
        phoneNumber: true,
        address: true,
        city: true,
        avatarUrl: true,
        updatedAt: true,
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
    
    // Clear refresh token to invalidate all sessions (security measure)
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash: newHash,
        refreshToken: null, // Force re-login on all devices
      },
    });

    return { message: 'Password changed successfully. Please login again.' };
  }

  // ─── UPLOAD CNIC ──────────────────────────────────────────────

  async uploadCnic(userId: string, cnicImageUrl: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        cnicImageUrl,
        isVerified: false, // Reset verification status on new upload
      },
    });

    return { 
      message: 'CNIC image uploaded. Awaiting admin verification.',
      cnicImageUrl,
    };
  }

  // ─── UPLOAD AVATAR ────────────────────────────────────────────

  async uploadAvatar(userId: string, avatarUrl: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  }

  // ─── GET USER DASHBOARD STATS ─────────────────────────────────

  async getDashboardStats(userId: string) {
    // Get user to check account type
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        accountType: true,
        isVerified: true,
        cnicImageUrl: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Common stats for all users
    const [totalCars, activeListings] = await Promise.all([
      this.prisma.userCar.count({ 
        where: { userId, isActive: true } 
      }),
      this.prisma.carListing.count({
        where: { userId, listingStatus: 'ACTIVE' },
      }),
    ]);

    // Count damage detections (CarImages with hasDamageDetected = true)
    const userCarIds = await this.prisma.userCar.findMany({
      where: { userId },
      select: { id: true },
    });
    
    const totalDamageDetections = await this.prisma.carImage.count({
      where: {
        carId: { in: userCarIds.map(car => car.id) },
        hasDamageDetected: true,
      },
    });

    // Determine CNIC verification status
    const cnicVerificationStatus = user.cnicImageUrl
      ? user.isVerified
        ? 'VERIFIED'
        : 'PENDING'
      : 'NOT_UPLOADED';

    // Base dashboard data
    const dashboardData: any = {
      totalCars,
      activeListings,
      totalDamageDetections,
      cnicVerificationStatus,
    };

    // Additional stats for CAR_RENTAL accounts
    if (user.accountType === 'CAR_RENTAL') {
      const [activeRentalBookings, rentalData] = await Promise.all([
        this.prisma.rental.count({
          where: { 
            userId,
            status: 'ACTIVE',
          },
        }),
        this.prisma.rental.findMany({
          where: { userId },
          select: {
            rentalPrice: true,
            totalCharges: true,
            status: true,
          },
        }),
      ]);

      // Calculate total revenue (sum of totalCharges for COMPLETED rentals)
      const totalRevenue = rentalData
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + Number(r.totalCharges || r.rentalPrice), 0);

      // Calculate fleet utilization % (active rentals / total cars)
      const fleetUtilization = totalCars > 0 
        ? ((activeRentalBookings / totalCars) * 100).toFixed(2)
        : '0.00';

      dashboardData.activeRentalBookings = activeRentalBookings;
      dashboardData.totalRevenue = totalRevenue;
      dashboardData.fleetUtilization = `${fleetUtilization}%`;
    }

    return dashboardData;
  }
}
