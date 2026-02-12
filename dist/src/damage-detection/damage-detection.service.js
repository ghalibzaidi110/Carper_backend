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
var DamageDetectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DamageDetectionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let DamageDetectionService = DamageDetectionService_1 = class DamageDetectionService {
    prisma;
    configService;
    httpService;
    logger = new common_1.Logger(DamageDetectionService_1.name);
    serviceUrl;
    constructor(prisma, configService, httpService) {
        this.prisma = prisma;
        this.configService = configService;
        this.httpService = httpService;
        this.serviceUrl = this.configService.get('DAMAGE_DETECTION_SERVICE_URL', 'http://localhost:8000');
    }
    async detectOnImage(imageId, userId) {
        const image = await this.prisma.carImage.findUnique({
            where: { id: imageId },
            include: {
                car: { select: { userId: true } },
            },
        });
        if (!image) {
            throw new common_1.NotFoundException('Image not found');
        }
        if (image.car.userId !== userId) {
            throw new common_1.BadRequestException('You do not own this car');
        }
        const result = await this.callYoloService(image.imageUrl);
        await this.prisma.carImage.update({
            where: { id: imageId },
            data: {
                hasDamageDetected: result.hasDamage,
                damageDetectionData: result,
            },
        });
        return result;
    }
    async detectOnCar(carId, userId) {
        const car = await this.prisma.userCar.findFirst({
            where: { id: carId, userId, isActive: true },
        });
        if (!car) {
            throw new common_1.NotFoundException('Car not found or does not belong to you');
        }
        const currentImages = await this.prisma.carImage.findMany({
            where: {
                carId,
                isCurrent: true,
                imageCategory: {
                    in: [
                        'PERIODIC_FRONT',
                        'PERIODIC_BACK',
                        'PERIODIC_LEFT',
                        'PERIODIC_RIGHT',
                    ],
                },
            },
        });
        if (currentImages.length === 0) {
            throw new common_1.BadRequestException('No current periodic images found. Upload periodic images first.');
        }
        const results = await Promise.all(currentImages.map(async (image) => {
            try {
                const result = await this.callYoloService(image.imageUrl);
                await this.prisma.carImage.update({
                    where: { id: image.id },
                    data: {
                        hasDamageDetected: result.hasDamage,
                        damageDetectionData: result,
                    },
                });
                return {
                    imageId: image.id,
                    category: image.imageCategory,
                    ...result,
                };
            }
            catch (error) {
                this.logger.error(`Detection failed for image ${image.id}: ${error.message}`);
                return {
                    imageId: image.id,
                    category: image.imageCategory,
                    hasDamage: false,
                    confidence: 0,
                    detections: [],
                    error: error.message,
                };
            }
        }));
        const totalDamages = results.filter((r) => r.hasDamage).length;
        return {
            carId,
            registrationNumber: car.registrationNumber,
            totalImagesScanned: currentImages.length,
            imagesWithDamage: totalDamages,
            results,
        };
    }
    async getDamageHistory(carId, userId) {
        const car = await this.prisma.userCar.findFirst({
            where: { id: carId, userId },
        });
        if (!car) {
            throw new common_1.NotFoundException('Car not found');
        }
        const images = await this.prisma.carImage.findMany({
            where: {
                carId,
                hasDamageDetected: true,
            },
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                imageCategory: true,
                imageUrl: true,
                thumbnailUrl: true,
                version: true,
                isCurrent: true,
                hasDamageDetected: true,
                damageDetectionData: true,
                uploadedAt: true,
            },
        });
        return {
            carId,
            registrationNumber: car.registrationNumber,
            totalDamageRecords: images.length,
            records: images,
        };
    }
    async callYoloService(imageUrl) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.serviceUrl}/detect`, {
                image_url: imageUrl,
            }, {
                timeout: 30000,
            }));
            const data = response.data;
            return {
                hasDamage: data.has_damage ?? false,
                confidence: data.confidence ?? 0,
                detections: (data.detections || []).map((d) => ({
                    label: d.label,
                    confidence: d.confidence,
                    bbox: d.bbox,
                })),
                processedImageUrl: data.processed_image_url,
            };
        }
        catch (error) {
            this.logger.error(`YOLOv8 service error: ${error.message}`);
            throw new common_1.InternalServerErrorException('Damage detection service is unavailable. Please try again later.');
        }
    }
};
exports.DamageDetectionService = DamageDetectionService;
exports.DamageDetectionService = DamageDetectionService = DamageDetectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        axios_1.HttpService])
], DamageDetectionService);
//# sourceMappingURL=damage-detection.service.js.map