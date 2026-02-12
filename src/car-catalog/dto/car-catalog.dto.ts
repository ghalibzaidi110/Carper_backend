import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCatalogDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  manufacturer: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  modelName: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(1900)
  year: number;

  @ApiProperty({ example: 'Altis Grande', required: false })
  @IsString()
  @IsOptional()
  variant?: string;

  @ApiProperty({ example: 'Sedan', required: false })
  @IsString()
  @IsOptional()
  bodyType?: string;

  @ApiProperty({ example: 'Petrol', required: false })
  @IsString()
  @IsOptional()
  fuelType?: string;

  @ApiProperty({ example: 'Automatic', required: false })
  @IsString()
  @IsOptional()
  transmission?: string;

  @ApiProperty({ example: '1800cc', required: false })
  @IsString()
  @IsOptional()
  engineCapacity?: string;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @IsOptional()
  seatingCapacity?: number;

  @ApiProperty({ example: 5999000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePrice: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['Sunroof', 'Cruise Control'], required: false })
  @IsOptional()
  features?: string[];
}

export class UpdateCatalogDto {
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  variant?: string;

  @IsString()
  @IsOptional()
  bodyType?: string;

  @IsString()
  @IsOptional()
  fuelType?: string;

  @IsString()
  @IsOptional()
  transmission?: string;

  @IsString()
  @IsOptional()
  engineCapacity?: string;

  @IsInt()
  @IsOptional()
  seatingCapacity?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  basePrice?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  features?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CatalogFilterDto {
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  year?: number;

  @IsString()
  @IsOptional()
  bodyType?: string;

  @IsString()
  @IsOptional()
  fuelType?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
