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
exports.RentalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rentals_service_1 = require("./rentals.service");
const dto_1 = require("./dto");
const decorators_1 = require("../common/decorators");
let RentalsController = class RentalsController {
    rentalsService;
    constructor(rentalsService) {
        this.rentalsService = rentalsService;
    }
    async create(userId, dto) {
        return this.rentalsService.create(userId, dto);
    }
    async findAll(userId, filters) {
        return this.rentalsService.findAll(userId, filters);
    }
    async getStats(userId) {
        return this.rentalsService.getBusinessStats(userId);
    }
    async findOne(id, userId) {
        return this.rentalsService.findOne(id, userId);
    }
    async complete(id, userId, dto) {
        return this.rentalsService.completeRental(id, userId, dto);
    }
    async cancel(id, userId) {
        return this.rentalsService.cancelRental(id, userId);
    }
};
exports.RentalsController = RentalsController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('CAR_RENTAL'),
    (0, decorators_1.RequireVerification)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new rental (CAR_RENTAL only)' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateRentalDto]),
    __metadata("design:returntype", Promise)
], RentalsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)('CAR_RENTAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all my rentals' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RentalFilterDto]),
    __metadata("design:returntype", Promise)
], RentalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, decorators_1.Roles)('CAR_RENTAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Get business rental stats' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RentalsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)('CAR_RENTAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Get rental details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RentalsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, decorators_1.Roles)('CAR_RENTAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete a rental (car returned)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.CompleteRentalDto]),
    __metadata("design:returntype", Promise)
], RentalsController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, decorators_1.Roles)('CAR_RENTAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a rental' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RentalsController.prototype, "cancel", null);
exports.RentalsController = RentalsController = __decorate([
    (0, swagger_1.ApiTags)('Rentals'),
    (0, common_1.Controller)('rentals'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [rentals_service_1.RentalsService])
], RentalsController);
//# sourceMappingURL=rentals.controller.js.map