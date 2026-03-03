import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ListingStatus } from '@prisma/client';

export class CreateListingDto {
  @ApiProperty({ description: 'Car ID to list for sale' })
  @IsString()
  carId: string;

  @ApiProperty({ example: 6500000 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  askingPrice: number;

  @ApiProperty({ example: 'Well-maintained Toyota Corolla 2023' })
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;
}

export class UpdateListingDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  askingPrice?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;
}

export class UpdateListingStatusDto {
  @ApiProperty({ enum: ListingStatus })
  @IsEnum(ListingStatus)
  listingStatus: ListingStatus;
}

export class ListingFilterDto {
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  yearMin?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  yearMax?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsString()
  @IsOptional()
  sortBy?: string; // 'price_asc', 'price_desc', 'latest', 'oldest'

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class ContactSellerDto {
  @ApiProperty({ example: 'Hi, I am interested in your car.' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'buyer@example.com' })
  @IsString()
  buyerEmail: string;

  @ApiProperty({ example: 'Ahmed Khan', required: false })
  @IsString()
  @IsOptional()
  buyerName?: string;
}
