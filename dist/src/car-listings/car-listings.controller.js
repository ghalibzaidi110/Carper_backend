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
exports.CarListingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const car_listings_service_1 = require("./car-listings.service");
const dto_1 = require("./dto");
const decorators_1 = require("../common/decorators");
let CarListingsController = class CarListingsController {
    listingsService;
    constructor(listingsService) {
        this.listingsService = listingsService;
    }
    async findAll(filters) {
        return this.listingsService.findAll(filters);
    }
    async findOne(id) {
        return this.listingsService.findOne(id);
    }
    async create(userId, dto) {
        return this.listingsService.create(userId, dto);
    }
    async getMyListings(userId) {
        return this.listingsService.getMyListings(userId);
    }
    async update(id, userId, dto) {
        return this.listingsService.update(id, userId, dto);
    }
    async updateStatus(id, userId, dto) {
        return this.listingsService.updateStatus(id, userId, dto);
    }
    async contactSeller(id, dto) {
        return this.listingsService.contactSeller(id, dto);
    }
};
exports.CarListingsController = CarListingsController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Browse marketplace listings (public)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListingFilterDto]),
    __metadata("design:returntype", Promise)
], CarListingsController.prototype, "findAll", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get listing details (public)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarListingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.RequireVerification)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new listing (CNIC verification required)' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateListingDto]),
    __metadata("design:returntype", Promise)
], CarListingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('my/listings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all my listings' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarListingsController.prototype, "getMyListings", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update listing (price, title, description)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateListingDto]),
    __metadata("design:returntype", Promise)
], CarListingsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update listing status (sold, inactive)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateListingStatusDto]),
    __metadata("design:returntype", Promise)
], CarListingsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/contact'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.RequireVerification)(),
    (0, swagger_1.ApiOperation)({ summary: 'Contact seller via email (CNIC verification required)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ContactSellerDto]),
    __metadata("design:returntype", Promise)
], CarListingsController.prototype, "contactSeller", null);
exports.CarListingsController = CarListingsController = __decorate([
    (0, swagger_1.ApiTags)('Car Listings (Marketplace)'),
    (0, common_1.Controller)('car-listings'),
    __metadata("design:paramtypes", [car_listings_service_1.CarListingsService])
], CarListingsController);
//# sourceMappingURL=car-listings.controller.js.map