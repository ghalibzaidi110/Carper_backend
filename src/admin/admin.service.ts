import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus, AccountType, NotificationType } from '@prisma/client';
import { AdminUserFilterDto, AdminUpdateUserDto, AdminSendNotificationDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  // ─── USER MANAGEMENT ──────────────────────────────────────────

  async getUsers(filters: AdminUserFilterDto) {
    const { accountType, accountStatus, isVerified, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (accountType) where.accountType = accountType;
    if (accountStatus) where.accountStatus = accountStatus;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          accountType: true,
          accountStatus: true,
          isVerified: true,
          phoneNumber: true,
          city: true,
          businessName: true,
          cnicImageUrl: true,
          avatarUrl: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              cars: true,
              listings: true,
              rentals: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        accountType: true,
        accountStatus: true,
        isVerified: true,
        phoneNumber: true,
        address: true,
        city: true,
        country: true,
        postalCode: true,
        businessName: true,
        businessLicense: true,
        cnicImageUrl: true,
        avatarUrl: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            cars: true,
            listings: true,
            rentals: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(userId: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.accountStatus && { accountStatus: dto.accountStatus }),
        ...(dto.accountType && { accountType: dto.accountType }),
        ...(dto.isVerified !== undefined && { isVerified: dto.isVerified }),
      },
    });

    // Send notification if verified
    if (dto.isVerified === true && !user.isVerified) {
      await this.notificationsService.create(userId, {
        title: 'CNIC Verified',
        message: 'Your CNIC has been verified. You can now create listings and rent cars.',
        type: NotificationType.SUCCESS,
      });

      await this.emailService.sendVerificationApprovedEmail(user.email, user.fullName);
    }

    // Send notification if suspended
    if (dto.accountStatus === AccountStatus.SUSPENDED && user.accountStatus !== AccountStatus.SUSPENDED) {
      await this.notificationsService.create(userId, {
        title: 'Account Suspended',
        message: 'Your account has been suspended. Contact support for more info.',
        type: NotificationType.WARNING,
      });
    }

    return updated;
  }

  // ─── CNIC VERIFICATION QUEUE ──────────────────────────────────

  async getPendingVerifications(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          cnicImageUrl: { not: null },
          isVerified: false,
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          accountType: true,
          cnicImageUrl: true,
          phoneNumber: true,
          city: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({
        where: {
          cnicImageUrl: { not: null },
          isVerified: false,
        },
      }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── SYSTEM NOTIFICATIONS ────────────────────────────────────

  async sendNotification(dto: AdminSendNotificationDto) {
    if (dto.sendToAll) {
      const allUsers = await this.prisma.user.findMany({
        where: { accountStatus: AccountStatus.ACTIVE },
        select: { id: true },
      });

      await this.notificationsService.createForMany(
        allUsers.map((u) => u.id),
        {
          title: dto.title,
          message: dto.message,
          type: NotificationType.SYSTEM,
        },
      );

      return { message: `Notification sent to ${allUsers.length} users` };
    }

    if (dto.userIds && dto.userIds.length > 0) {
      await this.notificationsService.createForMany(dto.userIds, {
        title: dto.title,
        message: dto.message,
        type: NotificationType.SYSTEM,
      });

      return { message: `Notification sent to ${dto.userIds.length} users` };
    }

    return { message: 'No recipients specified' };
  }

  // ─── PLATFORM ANALYTICS ──────────────────────────────────────

  async getPlatformStats() {
    const [
      totalUsers,
      totalIndividuals,
      totalRentalBusiness,
      totalCars,
      totalListings,
      activeListings,
      totalRentals,
      activeRentals,
      pendingVerifications,
      suspendedUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { accountStatus: { not: AccountStatus.DELETED } } }),
      this.prisma.user.count({ where: { accountType: AccountType.INDIVIDUAL } }),
      this.prisma.user.count({ where: { accountType: AccountType.CAR_RENTAL } }),
      this.prisma.userCar.count({ where: { isActive: true } }),
      this.prisma.carListing.count(),
      this.prisma.carListing.count({ where: { listingStatus: 'ACTIVE' } }),
      this.prisma.rental.count(),
      this.prisma.rental.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({
        where: { cnicImageUrl: { not: null }, isVerified: false },
      }),
      this.prisma.user.count({ where: { accountStatus: AccountStatus.SUSPENDED } }),
    ]);

    return {
      users: {
        total: totalUsers,
        individuals: totalIndividuals,
        rentalBusinesses: totalRentalBusiness,
        suspended: suspendedUsers,
        pendingVerifications,
      },
      cars: {
        total: totalCars,
      },
      listings: {
        total: totalListings,
        active: activeListings,
      },
      rentals: {
        total: totalRentals,
        active: activeRentals,
      },
    };
  }
}
