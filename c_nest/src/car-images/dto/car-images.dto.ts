import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ImageCategory } from '@prisma/client';

export class UploadRegistrationImagesDto {
  // Files handled via @UploadedFiles()
  // 4 files: front, back, left, right
}

export class UploadPeriodicImagesDto {
  // Files handled via @UploadedFiles()
  // 4 files: front, back, left, right
}

export class UploadDamageImageDto {
  @ApiProperty({ enum: ImageCategory, default: 'DAMAGE_DETECTION' })
  @IsEnum(ImageCategory)
  @IsOptional()
  imageCategory?: ImageCategory = ImageCategory.DAMAGE_DETECTION;
}

export class UploadListingImageDto {
  @ApiProperty({ enum: ImageCategory, default: 'LISTING_IMAGE' })
  @IsEnum(ImageCategory)
  @IsOptional()
  imageCategory?: ImageCategory = ImageCategory.LISTING_IMAGE;
}
