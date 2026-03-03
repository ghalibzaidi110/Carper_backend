"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
const email_service_1 = require("../email/email.service");
let AdminService = class AdminService {
    prisma;
    notificationsService;
    emailService;
    constructor(prisma, notificationsService, emailService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.emailService = emailService;
    }
    async getUsers(filters) {
        const { accountType, accountStatus, isVerified, search, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (accountType)
            where.accountType = accountType;
        if (accountStatus)
            where.accountStatus = accountStatus;
        if (isVerified !== undefined)
            where.isVerified = isVerified;
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
    async getUserDetail(userId) {
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
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateUser(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.accountStatus && { accountStatus: dto.accountStatus }),
                ...(dto.accountType && { accountType: dto.accountType }),
                ...(dto.isVerified !== undefined && { isVerified: dto.isVerified }),
            },
        });
        if (dto.isVerified === true && !user.isVerified) {
            await this.notificationsService.create(userId, {
                title: 'CNIC Verified',
                message: 'Your CNIC has been verified. You can now create listings and rent cars.',
                type: client_1.NotificationType.SUCCESS,
            });
            await this.emailService.sendVerificationApprovedEmail(user.email, user.fullName);
        }
        if (dto.accountStatus === client_1.AccountStatus.SUSPENDED && user.accountStatus !== client_1.AccountStatus.SUSPENDED) {
            await this.notificationsService.create(userId, {
                title: 'Account Suspended',
                message: 'Your account has been suspended. Contact support for more info.',
                type: client_1.NotificationType.WARNING,
            });
        }
        return updated;
    }
    async getPendingVerifications(page = 1, limit = 20) {
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
    async sendNotification(dto) {
        if (dto.sendToAll) {
            const allUsers = await this.prisma.user.findMany({
                where: { accountStatus: client_1.AccountStatus.ACTIVE },
                select: { id: true },
            });
            await this.notificationsService.createForMany(allUsers.map((u) => u.id), {
                title: dto.title,
                message: dto.message,
                type: client_1.NotificationType.SYSTEM,
            });
            return { message: `Notification sent to ${allUsers.length} users` };
        }
        if (dto.userIds && dto.userIds.length > 0) {
            await this.notificationsService.createForMany(dto.userIds, {
                title: dto.title,
                message: dto.message,
                type: client_1.NotificationType.SYSTEM,
            });
            return { message: `Notification sent to ${dto.userIds.length} users` };
        }
        return { message: 'No recipients specified' };
    }
    async getPlatformStats() {
        const [totalUsers, totalIndividuals, totalRentalBusiness, totalCars, totalListings, activeListings, totalRentals, activeRentals, pendingVerifications, suspendedUsers,] = await Promise.all([
            this.prisma.user.count({ where: { accountStatus: { not: client_1.AccountStatus.DELETED } } }),
            this.prisma.user.count({ where: { accountType: client_1.AccountType.INDIVIDUAL } }),
            this.prisma.user.count({ where: { accountType: client_1.AccountType.CAR_RENTAL } }),
            this.prisma.userCar.count({ where: { isActive: true } }),
            this.prisma.carListing.count(),
            this.prisma.carListing.count({ where: { listingStatus: 'ACTIVE' } }),
            this.prisma.rental.count(),
            this.prisma.rental.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count({
                where: { cnicImageUrl: { not: null }, isVerified: false },
            }),
            this.prisma.user.count({ where: { accountStatus: client_1.AccountStatus.SUSPENDED } }),
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        email_service_1.EmailService])
], AdminService);
//# sourceMappingURL=admin.service.js.map