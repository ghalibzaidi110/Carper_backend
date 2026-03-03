import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RentalStatus } from '@prisma/client';

// ─── CREATE RENTAL ──────────────────────────────────────────────

export class CreateRentalDto {
  @ApiProperty({ description: 'ID of the user car being rented out' })
  @IsString()
  carId: string;

  @ApiProperty({ description: 'Name of the renter' })
  @IsString()
  renterName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  renterPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  renterEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  renterCnic?: string;

  @ApiProperty({ description: 'Start date of rental period' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of rental period' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileageAtStart?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preRentalNotes?: string;

  @ApiProperty({ description: 'Rental price in PKR' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentalPrice: number;
}

// ─── COMPLETE RENTAL (Return) ───────────────────────────────────

export class CompleteRentalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileageAtEnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postRentalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  damageCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  damageDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalCharges?: number;
}

// ─── UPDATE RENTAL STATUS ───────────────────────────────────────

export class UpdateRentalStatusDto {
  @ApiProperty({ enum: RentalStatus })
  @IsEnum(RentalStatus)
  status: RentalStatus;
}

// ─── RENTAL FILTER ──────────────────────────────────────────────

export class RentalFilterDto {
  @ApiPropertyOptional({ enum: RentalStatus })
  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
