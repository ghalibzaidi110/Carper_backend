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
exports.DamageDetectionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const damage_detection_service_1 = require("./damage-detection.service");
const dto_1 = require("./dto");
const decorators_1 = require("../common/decorators");
let DamageDetectionController = class DamageDetectionController {
    detectionService;
    constructor(detectionService) {
        this.detectionService = detectionService;
    }
    async detectOnImage(dto, userId) {
        return this.detectionService.detectOnImage(dto.imageId, userId);
    }
    async detectOnCar(dto, userId) {
        return this.detectionService.detectOnCar(dto.carId, userId);
    }
    async getDamageHistory(carId, userId) {
        return this.detectionService.getDamageHistory(carId, userId);
    }
};
exports.DamageDetectionController = DamageDetectionController;
__decorate([
    (0, common_1.Post)('image'),
    (0, decorators_1.RequireVerification)(),
    (0, swagger_1.ApiOperation)({ summary: 'Run damage detection on a single image' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RunDetectionDto, String]),
    __metadata("design:returntype", Promise)
], DamageDetectionController.prototype, "detectOnImage", null);
__decorate([
    (0, common_1.Post)('car'),
    (0, decorators_1.RequireVerification)(),
    (0, swagger_1.ApiOperation)({ summary: 'Run damage detection on all current periodic images of a car' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RunDetectionOnCarDto, String]),
    __metadata("design:returntype", Promise)
], DamageDetectionController.prototype, "detectOnCar", null);
__decorate([
    (0, common_1.Get)('history/:carId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get damage detection history for a car' }),
    __param(0, (0, common_1.Param)('carId')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DamageDetectionController.prototype, "getDamageHistory", null);
exports.DamageDetectionController = DamageDetectionController = __decorate([
    (0, swagger_1.ApiTags)('Damage Detection'),
    (0, common_1.Controller)('damage-detection'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [damage_detection_service_1.DamageDetectionService])
], DamageDetectionController);
//# sourceMappingURL=damage-detection.controller.js.map