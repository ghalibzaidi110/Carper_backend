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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarImagesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const car_images_service_1 = require("./car-images.service");
const decorators_1 = require("../common/decorators");
let CarImagesController = class CarImagesController {
    carImagesService;
    constructor(carImagesService) {
        this.carImagesService = carImagesService;
    }
    async uploadRegistrationImages(carId, userId, files) {
        return this.carImagesService.uploadRegistrationImages(carId, userId, files);
    }
    async uploadPeriodicImages(carId, userId, files) {
        return this.carImagesService.uploadPeriodicImages(carId, userId, files);
    }
    async uploadSingleImage(carId, userId, file, category = client_1.ImageCategory.DAMAGE_DETECTION) {
        return this.carImagesService.uploadSingleImage(carId, userId, file, category);
    }
    async getCarImages(carId, currentOnly) {
        return this.carImagesService.getCarImages(carId, currentOnly === 'true');
    }
    async getRegistrationImages(carId) {
        return this.carImagesService.getRegistrationImages(carId);
    }
    async getInspectionHistory(carId) {
        return this.carImagesService.getInspectionHistory(carId);
    }
};
exports.CarImagesController = CarImagesController;
__decorate([
    (0, common_1.Post)(':carId/registration'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload 4 registration images (PERMANENT - cannot be changed)',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'front', maxCount: 1 },
        { name: 'back', maxCount: 1 },
        { name: 'left', maxCount: 1 },
        { name: 'right', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Param)('carId')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CarImagesController.prototype, "uploadRegistrationImages", null);
__decorate([
    (0, common_1.Post)(':carId/periodic'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload periodic inspection images (4 angles, creates new version)',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'front', maxCount: 1 },
        { name: 'back', maxCount: 1 },
        { name: 'left', maxCount: 1 },
        { name: 'right', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Param)('carId')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CarImagesController.prototype, "uploadPeriodicImages", null);
__decorate([
    (0, common_1.Post)(':carId/upload'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a single image (damage detection or listing)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    __param(0, (0, common_1.Param)('carId')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], CarImagesController.prototype, "uploadSingleImage", null);
__decorate([
    (0, common_1.Get)(':carId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all images for a car' }),
    __param(0, (0, common_1.Param)('carId')),
    __param(1, (0, common_1.Query)('currentOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CarImagesController.prototype, "getCarImages", null);
__decorate([
    (0, common_1.Get)(':carId/registration'),
    (0, swagger_1.ApiOperation)({ summary: 'Get registration (baseline) images' }),
    __param(0, (0, common_1.Param)('carId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarImagesController.prototype, "getRegistrationImages", null);
__decorate([
    (0, common_1.Get)(':carId/inspection-history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all periodic inspection versions' }),
    __param(0, (0, common_1.Param)('carId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarImagesController.prototype, "getInspectionHistory", null);
exports.CarImagesController = CarImagesController = __decorate([
    (0, swagger_1.ApiTags)('Car Images'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('car-images'),
    __metadata("design:paramtypes", [car_images_service_1.CarImagesService])
], CarImagesController);
//# sourceMappingURL=car-images.controller.js.map