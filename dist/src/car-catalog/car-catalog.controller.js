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
exports.CarCatalogController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const car_catalog_service_1 = require("./car-catalog.service");
const dto_1 = require("./dto");
const decorators_1 = require("../common/decorators");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let CarCatalogController = class CarCatalogController {
    catalogService;
    cloudinaryService;
    constructor(catalogService, cloudinaryService) {
        this.catalogService = catalogService;
        this.cloudinaryService = cloudinaryService;
    }
    async findAll(filters) {
        return this.catalogService.findAll(filters);
    }
    async getManufacturers() {
        return this.catalogService.getManufacturers();
    }
    async getModelsByManufacturer(manufacturer) {
        return this.catalogService.getModelsByManufacturer(manufacturer);
    }
    async findOne(id) {
        return this.catalogService.findOne(id);
    }
    async create(dto) {
        return this.catalogService.create(dto);
    }
    async bulkCreate(entries) {
        return this.catalogService.bulkCreate(entries);
    }
    async update(id, dto) {
        return this.catalogService.update(id, dto);
    }
    async remove(id) {
        return this.catalogService.remove(id);
    }
    async uploadImage(catalogId, file, isPrimary, altText) {
        const result = await this.cloudinaryService.uploadImage(file, 'catalog-images');
        return this.catalogService.addImage(catalogId, result.secure_url, isPrimary === 'true', altText);
    }
};
exports.CarCatalogController = CarCatalogController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Browse car catalog (public)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CatalogFilterDto]),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "findAll", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('manufacturers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of manufacturers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "getManufacturers", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('manufacturers/:manufacturer/models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get models by manufacturer' }),
    __param(0, (0, common_1.Param)('manufacturer')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "getModelsByManufacturer", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get catalog entry details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(client_1.AccountType.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add new car to catalog (Admin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCatalogDto]),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, decorators_1.Roles)(client_1.AccountType.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk add cars to catalog (Admin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "bulkCreate", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)(client_1.AccountType.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update catalog entry (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCatalogDto]),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)(client_1.AccountType.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete/deactivate catalog entry (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/images'),
    (0, decorators_1.Roles)(client_1.AccountType.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload catalog image (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('isPrimary')),
    __param(3, (0, common_1.Body)('altText')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], CarCatalogController.prototype, "uploadImage", null);
exports.CarCatalogController = CarCatalogController = __decorate([
    (0, swagger_1.ApiTags)('Car Catalog'),
    (0, common_1.Controller)('car-catalog'),
    __metadata("design:paramtypes", [car_catalog_service_1.CarCatalogService,
        cloudinary_service_1.CloudinaryService])
], CarCatalogController);
//# sourceMappingURL=car-catalog.controller.js.map