import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DamageDetectionService } from './damage-detection.service';
import { RunDetectionDto, RunDetectionOnCarDto } from './dto';
import { CurrentUser, RequireVerification } from '../common/decorators';

@ApiTags('Damage Detection')
@Controller('damage-detection')
@ApiBearerAuth()
export class DamageDetectionController {
  constructor(private detectionService: DamageDetectionService) {}

  @Post('image')
  @RequireVerification()
  @ApiOperation({ summary: 'Run damage detection on a single image' })
  async detectOnImage(
    @Body() dto: RunDetectionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.detectionService.detectOnImage(dto.imageId, userId);
  }

  @Post('car')
  @RequireVerification()
  @ApiOperation({ summary: 'Run damage detection on all current periodic images of a car' })
  async detectOnCar(
    @Body() dto: RunDetectionOnCarDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.detectionService.detectOnCar(dto.carId, userId);
  }

  @Get('history/:carId')
  @ApiOperation({ summary: 'Get damage detection history for a car' })
  async getDamageHistory(
    @Param('carId') carId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.detectionService.getDamageHistory(carId, userId);
  }
}
