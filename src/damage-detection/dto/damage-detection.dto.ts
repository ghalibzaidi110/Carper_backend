import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImageCategory } from '@prisma/client';

export class RunDetectionDto {
  @ApiProperty({ description: 'ID of the car image to run detection on' })
  @IsString()
  imageId: string;
}

export class RunDetectionOnCarDto {
  @ApiProperty({ description: 'ID of the car to run detection on (uses current periodic images)' })
  @IsString()
  carId: string;
}
