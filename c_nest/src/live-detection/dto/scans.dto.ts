import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const MIN_VEHICLE_YEAR = 1990;
const MAX_VEHICLE_YEAR = new Date().getFullYear() + 1;

/**
 * Per-entry payload for `POST /live-detection/scans`. The frontend's
 * LogEntry shape is intentionally allowed to evolve (depth/WebXR fields
 * keep being added), so the entry validator only constrains the fields
 * the backend uses for aggregate counts. The full entry is persisted
 * verbatim in `detectionsJson`.
 */
export class SaveScanEntryDto {
  @ApiProperty({ description: 'Frontend-side LogEntry id (used to match images by index)' })
  @IsInt()
  id!: number;

  @ApiProperty({ description: 'Damage class — drives the per-type counts' })
  @IsString()
  className!: string;

  // Everything else (bbox, panelLocation, estimate, vendors, etc.) is
  // accepted as-is. We don't re-validate the full LogEntry here because
  // (a) the data already passed the validators on the original
  // estimate/vendor calls, and (b) the shape is still in flux.
}

/**
 * Body of `POST /live-detection/scans` — sent as JSON or as the
 * `payload` field of a multipart form alongside the damage images.
 */
export class SaveScanDto {
  // ── Vehicle snapshot ──
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  vehicleMake!: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  vehicleModel!: string;

  @ApiProperty({ example: 2020, minimum: MIN_VEHICLE_YEAR, maximum: MAX_VEHICLE_YEAR })
  @IsInt()
  @Min(MIN_VEHICLE_YEAR)
  @Max(MAX_VEHICLE_YEAR)
  vehicleYear!: number;

  @ApiPropertyOptional({ enum: ['sedan', 'hatchback', 'suv', 'pickup', 'minivan'] })
  @IsOptional()
  @IsIn(['sedan', 'hatchback', 'suv', 'pickup', 'minivan'])
  vehicleCategory?: 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'minivan';

  @ApiPropertyOptional({ description: 'Optional UserCar.id to link to a registered car' })
  @IsOptional()
  @IsUUID()
  carId?: string;

  // ── Aggregate totals (computed by frontend, re-verified server-side) ──
  @ApiProperty({ example: 33000, minimum: 0 })
  @IsInt()
  @Min(0)
  totalCostPkr!: number;

  @ApiProperty({ example: 28000, minimum: 0 })
  @IsInt()
  @Min(0)
  totalLowPkr!: number;

  @ApiProperty({ example: 38000, minimum: 0 })
  @IsInt()
  @Min(0)
  totalHighPkr!: number;

  // ── Model versions ──
  @ApiPropertyOptional({ example: 'v4' })
  @IsOptional()
  @IsString()
  costModelVersion?: string;

  @ApiPropertyOptional({ example: 'v1' })
  @IsOptional()
  @IsString()
  damageModelVersion?: string;

  // ── Entries ──
  @ApiProperty({
    type: [SaveScanEntryDto],
    description:
      'Full LogEntry array. Persisted verbatim in detectionsJson; the ' +
      'entry index matches the position of the corresponding image file ' +
      '(if any) in the multipart payload. Entries without a captured ' +
      'image are still saved — the imageUrl field stays null.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveScanEntryDto)
  entries!: SaveScanEntryDto[];

  @ApiPropertyOptional({ description: 'Optional user-entered note' })
  @IsOptional()
  @IsString()
  notes?: string;
}
