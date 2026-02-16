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
exports.VerifyUserDto = exports.UpdateUserStatusDto = exports.ChangePasswordDto = exports.UpdateProfileDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UpdateProfileDto {
    fullName;
    phoneNumber;
    city;
    address;
    avatarUrl;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        example: 'John Doe',
        description: 'Full name of the user',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(2, { message: 'Full name must be at least 2 characters long' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Full name cannot exceed 100 characters' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        example: '+923001234567',
        description: 'Phone number in international format',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\+?[1-9]\d{1,14}$/, {
        message: 'Phone number must be in valid international format',
    }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        example: 'Lahore',
        description: 'City name',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(2, { message: 'City must be at least 2 characters long' }),
    (0, class_validator_1.MaxLength)(50, { message: 'City cannot exceed 50 characters' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        example: 'House 123, Street 45, DHA Phase 5',
        description: 'Complete address',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(5, { message: 'Address must be at least 5 characters long' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Address cannot exceed 200 characters' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        example: 'https://res.cloudinary.com/carper/image/upload/v1234567890/avatar.jpg',
        description: 'Avatar image URL (uploaded via /users/upload-avatar)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "avatarUrl", void 0);
class ChangePasswordDto {
    currentPassword;
    newPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'OldPass@123',
        description: 'Current password for verification',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'NewPass@456',
        description: 'New password (min 8 chars, must include uppercase, lowercase, number, special char)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters long' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
        message: 'Password must contain at least one uppercase, one lowercase, one number and one special character',
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
class UpdateUserStatusDto {
    accountStatus;
}
exports.UpdateUserStatusDto = UpdateUserStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AccountStatus }),
    (0, class_validator_1.IsEnum)(client_1.AccountStatus),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "accountStatus", void 0);
class VerifyUserDto {
    isVerified;
}
exports.VerifyUserDto = VerifyUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], VerifyUserDto.prototype, "isVerified", void 0);
//# sourceMappingURL=users.dto.js.map