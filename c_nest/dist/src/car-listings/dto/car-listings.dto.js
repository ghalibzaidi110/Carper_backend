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
exports.ContactSellerDto = exports.ListingFilterDto = exports.UpdateListingStatusDto = exports.UpdateListingDto = exports.CreateListingDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateListingDto {
    carId;
    askingPrice;
    title;
    description;
    isNegotiable;
}
exports.CreateListingDto = CreateListingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Car ID to list for sale' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "carId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 6500000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "askingPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Well-maintained Toyota Corolla 2023' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateListingDto.prototype, "isNegotiable", void 0);
class UpdateListingDto {
    askingPrice;
    title;
    description;
    isNegotiable;
}
exports.UpdateListingDto = UpdateListingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateListingDto.prototype, "askingPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateListingDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateListingDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateListingDto.prototype, "isNegotiable", void 0);
class UpdateListingStatusDto {
    listingStatus;
}
exports.UpdateListingStatusDto = UpdateListingStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ListingStatus }),
    (0, class_validator_1.IsEnum)(client_1.ListingStatus),
    __metadata("design:type", String)
], UpdateListingStatusDto.prototype, "listingStatus", void 0);
class ListingFilterDto {
    manufacturer;
    modelName;
    yearMin;
    yearMax;
    priceMin;
    priceMax;
    city;
    condition;
    sortBy;
    page = 1;
    limit = 20;
}
exports.ListingFilterDto = ListingFilterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListingFilterDto.prototype, "manufacturer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListingFilterDto.prototype, "modelName", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListingFilterDto.prototype, "yearMin", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListingFilterDto.prototype, "yearMax", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListingFilterDto.prototype, "priceMin", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListingFilterDto.prototype, "priceMax", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListingFilterDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListingFilterDto.prototype, "condition", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListingFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListingFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListingFilterDto.prototype, "limit", void 0);
class ContactSellerDto {
    message;
    buyerEmail;
    buyerName;
}
exports.ContactSellerDto = ContactSellerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Hi, I am interested in your car.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactSellerDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'buyer@example.com' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactSellerDto.prototype, "buyerEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ahmed Khan', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ContactSellerDto.prototype, "buyerName", void 0);
//# sourceMappingURL=car-listings.dto.js.map