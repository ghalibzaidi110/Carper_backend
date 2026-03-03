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
exports.CarFilterDto = exports.UpdateCarDto = exports.RegisterCarDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class RegisterCarDto {
    catalogId;
    registrationNumber;
    vinNumber;
    color;
    mileage;
    condition;
    purchaseDate;
    purchasePrice;
}
exports.RegisterCarDto = RegisterCarDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Catalog ID to link (from car catalog)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCarDto.prototype, "catalogId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ABC-1234' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCarDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterCarDto.prototype, "vinNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'White Pearl' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterCarDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25000 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], RegisterCarDto.prototype, "mileage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CarCondition, default: 'USED' }),
    (0, class_validator_1.IsEnum)(client_1.CarCondition),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterCarDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterCarDto.prototype, "purchaseDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5800000, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], RegisterCarDto.prototype, "purchasePrice", void 0);
class UpdateCarDto {
    color;
    mileage;
    condition;
}
exports.UpdateCarDto = UpdateCarDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCarDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateCarDto.prototype, "mileage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsEnum)(client_1.CarCondition),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCarDto.prototype, "condition", void 0);
class CarFilterDto {
    manufacturer;
    modelName;
    year;
    page = 1;
    limit = 20;
}
exports.CarFilterDto = CarFilterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CarFilterDto.prototype, "manufacturer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CarFilterDto.prototype, "modelName", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CarFilterDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CarFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CarFilterDto.prototype, "limit", void 0);
//# sourceMappingURL=user-cars.dto.js.map