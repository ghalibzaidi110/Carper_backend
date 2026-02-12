import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CarCondition } from '@prisma/client';

export class RegisterCarDto {
  @ApiProperty({ description: 'Catalog ID to link (from car catalog)' })
  @IsString()
  catalogId: string;

  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  registrationNumber: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  vinNumber?: string;

  @ApiProperty({ example: 'White Pearl' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 25000 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  mileage?: number;

  @ApiProperty({ enum: CarCondition, default: 'USED' })
  @IsEnum(CarCondition)
  @IsOptional()
  condition?: CarCondition;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiProperty({ example: 5800000, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  purchasePrice?: number;
}

export class UpdateCarDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  mileage?: number;

  @ApiProperty({ required: false })
  @IsEnum(CarCondition)
  @IsOptional()
  condition?: CarCondition;
}

export class CarFilterDto {
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

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
