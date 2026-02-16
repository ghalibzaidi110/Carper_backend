"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateProfile(userId, dto) {
        if (dto.phoneNumber) {
            const existingPhone = await this.prisma.user.findFirst({
                where: {
                    phoneNumber: dto.phoneNumber,
                    id: { not: userId },
                },
            });
            if (existingPhone) {
                throw new common_1.ConflictException('Phone number is already registered by another user');
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
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.BadRequestException('Cannot change password for OAuth-only accounts');
        }
        const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const newHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newHash,
                refreshToken: null,
            },
        });
        return { message: 'Password changed successfully. Please login again.' };
    }
    async uploadCnic(userId, cnicImageUrl) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                cnicImageUrl,
                isVerified: false,
            },
        });
        return {
            message: 'CNIC image uploaded. Awaiting admin verification.',
            cnicImageUrl,
        };
    }
    async uploadAvatar(userId, avatarUrl) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });
        return {
            message: 'Avatar uploaded successfully',
            avatarUrl,
        };
    }
    async getDashboardStats(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                accountType: true,
                isVerified: true,
                cnicImageUrl: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const [totalCars, activeListings] = await Promise.all([
            this.prisma.userCar.count({
                where: { userId, isActive: true }
            }),
            this.prisma.carListing.count({
                where: { userId, listingStatus: 'ACTIVE' },
            }),
        ]);
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
        const cnicVerificationStatus = user.cnicImageUrl
            ? user.isVerified
                ? 'VERIFIED'
                : 'PENDING'
            : 'NOT_UPLOADED';
        const dashboardData = {
            totalCars,
            activeListings,
            totalDamageDetections,
            cnicVerificationStatus,
        };
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
            const totalRevenue = rentalData
                .filter(r => r.status === 'COMPLETED')
                .reduce((sum, r) => sum + Number(r.totalCharges || r.rentalPrice), 0);
            const fleetUtilization = totalCars > 0
                ? ((activeRentalBookings / totalCars) * 100).toFixed(2)
                : '0.00';
            dashboardData.activeRentalBookings = activeRentalBookings;
            dashboardData.totalRevenue = totalRevenue;
            dashboardData.fleetUtilization = `${fleetUtilization}%`;
        }
        return dashboardData;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map