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
exports.UserCarsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_cars_service_1 = require("./user-cars.service");
const dto_1 = require("./dto");
const decorators_1 = require("../common/decorators");
let UserCarsController = class UserCarsController {
    userCarsService;
    constructor(userCarsService) {
        this.userCarsService = userCarsService;
    }
    async registerCar(userId, dto) {
        return this.userCarsService.registerCar(userId, dto);
    }
    async findAllMyCars(userId) {
        return this.userCarsService.findAllByUser(userId);
    }
    async findOne(carId, userId) {
        return this.userCarsService.findOne(carId, userId);
    }
    async update(carId, userId, dto) {
        return this.userCarsService.update(carId, userId, dto);
    }
    async remove(carId, userId) {
        return this.userCarsService.remove(carId, userId);
    }
    async checkRegistrationImages(carId) {
        const hasImages = await this.userCarsService.hasRegistrationImages(carId);
        return { hasRegistrationImages: hasImages };
    }
};
exports.UserCarsController = UserCarsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new car (must be from catalog)' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RegisterCarDto]),
    __metadata("design:returntype", Promise)
], UserCarsController.prototype, "registerCar", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all your registered cars' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserCarsController.prototype, "findAllMyCars", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get car details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserCarsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update car details (color, mileage, condition)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateCarDto]),
    __metadata("design:returntype", Promise)
], UserCarsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete car (soft delete, must have no active listings)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserCarsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/has-registration-images'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if car has all 4 registration images' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserCarsController.prototype, "checkRegistrationImages", null);
exports.UserCarsController = UserCarsController = __decorate([
    (0, swagger_1.ApiTags)('User Cars'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('user-cars'),
    __metadata("design:paramtypes", [user_cars_service_1.UserCarsService])
], UserCarsController);
//# sourceMappingURL=user-cars.controller.js.map