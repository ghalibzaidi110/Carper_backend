import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

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
  @IsNumber()
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

  @ApiProperty({ example: 0.7 })
  @IsNumber()
  confidence!: number;

  @ApiProperty({
    description: 'Bounding box [x, y, w, h] in pixels',
    example: [100, 100, 200, 150],
  })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  bbox!: number[];

  @ApiPropertyOptional({ example: 921600 })
  @IsOptional()
  @IsNumber()
  frameArea?: number;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  vehicleMake?: string;

  @ApiPropertyOptional({ example: 'Corolla' })
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @IsNumber()
  vehicleYear?: number;

  @ApiPropertyOptional({ example: 45.5 })
  @IsOptional()
  @IsNumber()
  areaCm2?: number;

  @ApiPropertyOptional({ example: 28.4 })
  @IsOptional()
  @IsNumber()
  perimCm?: number;

  @ApiPropertyOptional({ enum: ['minor', 'moderate', 'significant', 'severe'] })
  @IsOptional()
  @IsIn(['minor', 'moderate', 'significant', 'severe'])
  severity?: 'minor' | 'moderate' | 'significant' | 'severe';
}
