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
exports.UploadListingImageDto = exports.UploadDamageImageDto = exports.UploadPeriodicImagesDto = exports.UploadRegistrationImagesDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UploadRegistrationImagesDto {
}
exports.UploadRegistrationImagesDto = UploadRegistrationImagesDto;
class UploadPeriodicImagesDto {
}
exports.UploadPeriodicImagesDto = UploadPeriodicImagesDto;
class UploadDamageImageDto {
    imageCategory = client_1.ImageCategory.DAMAGE_DETECTION;
}
exports.UploadDamageImageDto = UploadDamageImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ImageCategory, default: 'DAMAGE_DETECTION' }),
    (0, class_validator_1.IsEnum)(client_1.ImageCategory),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadDamageImageDto.prototype, "imageCategory", void 0);
class UploadListingImageDto {
    imageCategory = client_1.ImageCategory.LISTING_IMAGE;
}
exports.UploadListingImageDto = UploadListingImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ImageCategory, default: 'LISTING_IMAGE' }),
    (0, class_validator_1.IsEnum)(client_1.ImageCategory),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadListingImageDto.prototype, "imageCategory", void 0);
//# sourceMappingURL=car-images.dto.js.map