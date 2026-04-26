import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Practical upper bounds. Frames much larger than 8K (7680×4320) come from
// no real-world camera, so anything beyond is almost certainly garbage.
const MAX_PIXEL_DIMENSION = 8000;
const MAX_FRAME_AREA = 8000 * 8000;
const MIN_VEHICLE_YEAR = 1990;
const MAX_VEHICLE_YEAR = new Date().getFullYear() + 1;

export class VehicleDto {
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Corolla' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @IsInt()
  @Min(MIN_VEHICLE_YEAR)
  @Max(MAX_VEHICLE_YEAR)
  year?: number;
}

export class VendorSearchDto {
  @ApiProperty({
    enum: ['glass_shatter', 'tire_flat', 'lamp_broken'],
    description: 'Damage class that triggers parts-replacement search',
  })
  @IsString()
  @IsIn(['glass_shatter', 'tire_flat', 'lamp_broken'])
  damageType!: 'glass_shatter' | 'tire_flat' | 'lamp_broken';

  @ApiPropertyOptional({ type: VehicleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle?: VehicleDto;

  @ApiPropertyOptional({ description: 'Panel where the damage was located' })
  @IsOptional()
  @IsString()
  panelLocation?: string;
}

export class CostEstimateDto {
  @ApiProperty({ example: 'dent', description: 'Damage class name' })
  @IsString()
  className!: string;

  @ApiPropertyOptional({ example: 'hood' })
  @IsOptional()
  @IsString()
  panelLocation?: string;

  @ApiPropertyOptional({
    description:
      'Panel bbox [x, y, w, h] in pixels — used by the backend as a ' +
      'real-world reference for converting damage pixels to centimetres ' +
      '(panel-as-ruler scaling). Optional; falls back to fixed-distance ' +
      'estimate when missing.',
    example: [140, 60, 1000, 600],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(MAX_PIXEL_DIMENSION, { each: true })
  panelBbox?: number[];

  @ApiPropertyOptional({
    description: '[width, height] of the source frame in pixels',
    example: [1920, 1080],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(MAX_PIXEL_DIMENSION, { each: true })
  frameSize?: number[];

  @ApiPropertyOptional({
    enum: ['sedan', 'hatchback', 'suv', 'pickup', 'minivan'],
    description: 'Vehicle body category — used to look up panel dimensions',
  })
  @IsOptional()
  @IsIn(['sedan', 'hatchback', 'suv', 'pickup', 'minivan'])
  vehicleCategory?: 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'minivan';

  @ApiProperty({ example: 0.7, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @ApiProperty({
    description: 'Bounding box [x, y, w, h] in pixels',
    example: [100, 100, 200, 150],
  })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(MAX_PIXEL_DIMENSION, { each: true })
  bbox!: number[];

  @ApiPropertyOptional({ example: 921600 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(MAX_FRAME_AREA)
  frameArea?: number;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  vehicleMake?: string;

  @ApiPropertyOptional({ example: 'Corolla' })
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @ApiPropertyOptional({ example: 2020, minimum: MIN_VEHICLE_YEAR, maximum: MAX_VEHICLE_YEAR })
  @IsOptional()
  @IsInt()
  @Min(MIN_VEHICLE_YEAR)
  @Max(MAX_VEHICLE_YEAR)
  vehicleYear?: number;

  @ApiPropertyOptional({ example: 45.5, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000)  // sanity ceiling — no real damage is 100m²
  areaCm2?: number;

  @ApiPropertyOptional({ example: 28.4, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100_000)
  perimCm?: number;

  @ApiPropertyOptional({ enum: ['minor', 'moderate', 'significant', 'severe'] })
  @IsOptional()
  @IsIn(['minor', 'moderate', 'significant', 'severe'])
  severity?: 'minor' | 'moderate' | 'significant' | 'severe';
}
