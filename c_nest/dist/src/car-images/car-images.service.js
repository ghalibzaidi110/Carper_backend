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
exports.CarImagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const REGISTRATION_CATEGORIES = [
    'REGISTRATION_FRONT',
    'REGISTRATION_BACK',
    'REGISTRATION_LEFT',
    'REGISTRATION_RIGHT',
];
const PERIODIC_CATEGORIES = [
    'PERIODIC_FRONT',
    'PERIODIC_BACK',
    'PERIODIC_LEFT',
    'PERIODIC_RIGHT',
];
let CarImagesService = class CarImagesService {
    prisma;
    cloudinaryService;
    constructor(prisma, cloudinaryService) {
        this.prisma = prisma;
        this.cloudinaryService = cloudinaryService;
    }
    async uploadRegistrationImages(carId, userId, files) {
        const car = await this.prisma.userCar.findUnique({
            where: { id: carId },
        });
        if (!car)
            throw new common_1.NotFoundException('Car not found');
        if (car.userId !== userId)
            throw new common_1.ForbiddenException('Not your car');
        const existingCount = await this.prisma.carImage.count({
            where: {
                carId,
                isPermanent: true,
                imageCategory: { in: REGISTRATION_CATEGORIES },
            },
        });
        if (existingCount > 0) {
            throw new common_1.BadRequestException('Registration images already exist and cannot be changed');
        }
        if (!files.front?.[0] || !files.back?.[0] || !files.left?.[0] || !files.right?.[0]) {
            throw new common_1.BadRequestException('All 4 registration images are required: front, back, left, right');
        }
        const folder = `car-images/${carId}/registration`;
        const [frontResult, backResult, leftResult, rightResult] = await Promise.all([
            this.cloudinaryService.uploadImage(files.front[0], folder),
            this.cloudinaryService.uploadImage(files.back[0], folder),
            this.cloudinaryService.uploadImage(files.left[0], folder),
            this.cloudinaryService.uploadImage(files.right[0], folder),
        ]);
        const images = await this.prisma.$transaction([
            this.prisma.carImage.create({
                data: {
                    carId,
                    imageCategory: 'REGISTRATION_FRONT',
                    imageUrl: frontResult.secure_url,
                    thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(frontResult.secure_url),
                    cloudinaryPublicId: frontResult.public_id,
                    fileSize: frontResult.bytes,
                    fileType: frontResult.format,
                    isPermanent: true,
                    isCurrent: true,
                    version: 1,
                },
            }),
            this.prisma.carImage.create({
                data: {
                    carId,
                    imageCategory: 'REGISTRATION_BACK',
                    imageUrl: backResult.secure_url,
                    thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(backResult.secure_url),
                    cloudinaryPublicId: backResult.public_id,
                    fileSize: backResult.bytes,
                    fileType: backResult.format,
                    isPermanent: true,
                    isCurrent: true,
                    version: 1,
                },
            }),
            this.prisma.carImage.create({
                data: {
                    carId,
                    imageCategory: 'REGISTRATION_LEFT',
                    imageUrl: leftResult.secure_url,
                    thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(leftResult.secure_url),
                    cloudinaryPublicId: leftResult.public_id,
                    fileSize: leftResult.bytes,
                    fileType: leftResult.format,
                    isPermanent: true,
                    isCurrent: true,
                    version: 1,
                },
            }),
            this.prisma.carImage.create({
                data: {
                    carId,
                    imageCategory: 'REGISTRATION_RIGHT',
                    imageUrl: rightResult.secure_url,
                    thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(rightResult.secure_url),
                    cloudinaryPublicId: rightResult.public_id,
                    fileSize: rightResult.bytes,
                    fileType: rightResult.format,
                    isPermanent: true,
                    isCurrent: true,
                    version: 1,
                },
            }),
        ]);
        return images;
    }
    async uploadPeriodicImages(carId, userId, files) {
        const car = await this.prisma.userCar.findUnique({
            where: { id: carId },
        });
        if (!car)
            throw new common_1.NotFoundException('Car not found');
        if (car.userId !== userId)
            throw new common_1.ForbiddenException('Not your car');
        if (!files.front?.[0] || !files.back?.[0] || !files.left?.[0] || !files.right?.[0]) {
            throw new common_1.BadRequestException('All 4 periodic images are required: front, back, left, right');
        }
        const latestPeriodic = await this.prisma.carImage.findFirst({
            where: {
                carId,
                imageCategory: { in: PERIODIC_CATEGORIES },
            },
            orderBy: { version: 'desc' },
            select: { version: true },
        });
        const newVersion = (latestPeriodic?.version || 0) + 1;
        await this.prisma.carImage.updateMany({
            where: {
                carId,
                imageCategory: { in: PERIODIC_CATEGORIES },
                isCurrent: true,
            },
            data: { isCurrent: false },
        });
        const folder = `car-images/${carId}/periodic/v${newVersion}`;
        const [frontResult, backResult, leftResult, rightResult] = await Promise.all([
            this.cloudinaryService.uploadImage(files.front[0], folder),
            this.cloudinaryService.uploadImage(files.back[0], folder),
            this.cloudinaryService.uploadImage(files.left[0], folder),
            this.cloudinaryService.uploadImage(files.right[0], folder),
        ]);
        const images = await this.prisma.$transaction([
            this.prisma.carImage.create({
                data: {
                    carId,
                    imageCategory: 'PERIODIC_FRONT',
                    imageUrl: frontResult.secure_url,
                    thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(frontResult.secure_url),
                    cloudinaryPublicId: frontResult.public_id,
                    fileSize: frontResult.bytes,
                    fileType: frontResult.format,
                    isPermanent: false,
                    isCurrent: true,
                    version: newVersion,
                },
            }),
            this.prisma.carImage.create({
                data: {
                    carId,
                    imageCategory: 'PERIODIC_BACK',
                    imageUrl: backResult.secure_url,
                    thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(backResult.secure_url),
                    cloudinaryPublicId: backResult.public_id,
                    fileSize: backResult.bytes,
                    fileType: backResult.format,
                    isPermanent: false,
                    isCurrent: true,
                    version: newVersion,
                },
            }),
            this.prisma.carImage.create({
                data: {
                    carId,
                    imageCategory: 'PERIODIC_LEFT',
                    imageUrl: leftResult.secure_url,
                    thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(leftResult.secure_url),
                    cloudinaryPublicId: leftResult.public_id,
                    fileSize: leftResult.bytes,
                    fileType: leftResult.format,
                    isPermanent: false,
                    isCurrent: true,
                    version: newVersion,
                },
            }),
            this.prisma.carImage.create({
                data: {
                    carId,
                    imageCategory: 'PERIODIC_RIGHT',
                    imageUrl: rightResult.secure_url,
                    thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(rightResult.secure_url),
                    cloudinaryPublicId: rightResult.public_id,
                    fileSize: rightResult.bytes,
                    fileType: rightResult.format,
                    isPermanent: false,
                    isCurrent: true,
                    version: newVersion,
                },
            }),
        ]);
        return { version: newVersion, images };
    }
    async uploadSingleImage(carId, userId, file, category) {
        const car = await this.prisma.userCar.findUnique({
            where: { id: carId },
        });
        if (!car)
            throw new common_1.NotFoundException('Car not found');
        if (car.userId !== userId)
            throw new common_1.ForbiddenException('Not your car');
        const folder = `car-images/${carId}/${category.toLowerCase()}`;
        const result = await this.cloudinaryService.uploadImage(file, folder);
        return this.prisma.carImage.create({
            data: {
                carId,
                imageCategory: category,
                imageUrl: result.secure_url,
                thumbnailUrl: this.cloudinaryService.generateThumbnailUrl(result.secure_url),
                cloudinaryPublicId: result.public_id,
                fileSize: result.bytes,
                fileType: result.format,
                isPermanent: false,
                isCurrent: true,
            },
        });
    }
    async getCarImages(carId, currentOnly = false) {
        const where = { carId };
        if (currentOnly)
            where.isCurrent = true;
        return this.prisma.carImage.findMany({
            where,
            orderBy: [{ imageCategory: 'asc' }, { version: 'desc' }],
        });
    }
    async getRegistrationImages(carId) {
        return this.prisma.carImage.findMany({
            where: {
                carId,
                isPermanent: true,
                imageCategory: { in: REGISTRATION_CATEGORIES },
            },
            orderBy: { imageCategory: 'asc' },
        });
    }
    async getInspectionHistory(carId) {
        const images = await this.prisma.carImage.findMany({
            where: {
                carId,
                imageCategory: { in: PERIODIC_CATEGORIES },
            },
            orderBy: [{ version: 'desc' }, { imageCategory: 'asc' }],
        });
        const grouped = {};
        for (const img of images) {
            if (!grouped[img.version])
                grouped[img.version] = [];
            grouped[img.version].push(img);
        }
        return Object.entries(grouped)
            .map(([version, imgs]) => ({
            version: Number(version),
            images: imgs,
            uploadedAt: imgs[0]?.uploadedAt,
            isCurrent: imgs[0]?.isCurrent,
        }))
            .sort((a, b) => b.version - a.version);
    }
    async getCurrentPeriodicVersion(carId) {
        const latest = await this.prisma.carImage.findFirst({
            where: {
                carId,
                imageCategory: { in: PERIODIC_CATEGORIES },
            },
            orderBy: { version: 'desc' },
            select: { version: true },
        });
        return latest?.version || 0;
    }
};
exports.CarImagesService = CarImagesService;
exports.CarImagesService = CarImagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cloudinary_service_1.CloudinaryService])
], CarImagesService);
//# sourceMappingURL=car-images.service.js.map