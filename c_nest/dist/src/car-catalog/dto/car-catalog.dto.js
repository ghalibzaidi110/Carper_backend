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
exports.CatalogFilterDto = exports.UpdateCatalogDto = exports.CreateCatalogDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateCatalogDto {
    manufacturer;
    modelName;
    year;
    variant;
    bodyType;
    fuelType;
    transmission;
    engineCapacity;
    seatingCapacity;
    basePrice;
    description;
    features;
}
exports.CreateCatalogDto = CreateCatalogDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Toyota' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCatalogDto.prototype, "manufacturer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Corolla' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCatalogDto.prototype, "modelName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2024 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1900),
    __metadata("design:type", Number)
], CreateCatalogDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Altis Grande', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCatalogDto.prototype, "variant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sedan', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCatalogDto.prototype, "bodyType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Petrol', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCatalogDto.prototype, "fuelType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Automatic', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCatalogDto.prototype, "transmission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1800cc', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCatalogDto.prototype, "engineCapacity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCatalogDto.prototype, "seatingCapacity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5999000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCatalogDto.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCatalogDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['Sunroof', 'Cruise Control'], required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCatalogDto.prototype, "features", void 0);
class UpdateCatalogDto {
    manufacturer;
    modelName;
    year;
    variant;
    bodyType;
    fuelType;
    transmission;
    engineCapacity;
    seatingCapacity;
    basePrice;
    description;
    features;
    isActive;
}
exports.UpdateCatalogDto = UpdateCatalogDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCatalogDto.prototype, "manufacturer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCatalogDto.prototype, "modelName", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateCatalogDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCatalogDto.prototype, "variant", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCatalogDto.prototype, "bodyType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCatalogDto.prototype, "fuelType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCatalogDto.prototype, "transmission", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCatalogDto.prototype, "engineCapacity", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateCatalogDto.prototype, "seatingCapacity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateCatalogDto.prototype, "basePrice", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCatalogDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateCatalogDto.prototype, "features", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateCatalogDto.prototype, "isActive", void 0);
class CatalogFilterDto {
    manufacturer;
    modelName;
    year;
    bodyType;
    fuelType;
    page = 1;
    limit = 20;
}
exports.CatalogFilterDto = CatalogFilterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CatalogFilterDto.prototype, "manufacturer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CatalogFilterDto.prototype, "modelName", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CatalogFilterDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CatalogFilterDto.prototype, "bodyType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CatalogFilterDto.prototype, "fuelType", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CatalogFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CatalogFilterDto.prototype, "limit", void 0);
//# sourceMappingURL=car-catalog.dto.js.map