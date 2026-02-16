import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({
    required: false,
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullName?: string;

  @ApiProperty({
    required: false,
    example: '+923001234567',
    description: 'Phone number in international format',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in valid international format',
  })
  phoneNumber?: string;

  @ApiProperty({
    required: false,
    example: 'Lahore',
    description: 'City name',
  })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  @MaxLength(50, { message: 'City cannot exceed 50 characters' })
  city?: string;

  @ApiProperty({
    required: false,
    example: 'House 123, Street 45, DHA Phase 5',
    description: 'Complete address',
  })
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  @MaxLength(200, { message: 'Address cannot exceed 200 characters' })
  address?: string;

  @ApiProperty({
    required: false,
    example: 'https://res.cloudinary.com/carper/image/upload/v1234567890/avatar.jpg',
    description: 'Avatar image URL (uploaded via /users/upload-avatar)',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPass@123',
    description: 'Current password for verification',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPass@456',
    description:
      'New password (min 8 chars, must include uppercase, lowercase, number, special char)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message:
      'Password must contain at least one uppercase, one lowercase, one number and one special character',
  })
  newPassword: string;
}

// Admin DTOs
export class UpdateUserStatusDto {
  @ApiProperty({ enum: AccountStatus })
  @IsEnum(AccountStatus)
  accountStatus: AccountStatus;
}

export class VerifyUserDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isVerified: boolean;
}
