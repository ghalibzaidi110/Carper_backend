import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DamageDetectionService } from './damage-detection.service';
import { RunDetectionDto, RunDetectionOnCarDto } from './dto';
import { CurrentUser, RequireVerification, Public } from '../common/decorators';

@ApiTags('Damage Detection')
@Controller('damage-detection')
@ApiBearerAuth()
export class DamageDetectionController {
  constructor(private detectionService: DamageDetectionService) {}

  @Post('scan')
  @Public()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload image(s) for damage detection',
    description:
      'Accepts one or more images. When Python service is not available, returns processed images (with visual differentiation) and dummy damage data. When Python is available, calls the detection API and returns real results.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Multiple images (max 10)',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Single image (alternative to images)',
        },
      },
    },
  })
  async scanByUpload(
    @UploadedFiles() files: { images?: Express.Multer.File[]; image?: Express.Multer.File[] },
  ) {
    const list = files?.images?.length
      ? files.images
      : files?.image?.length
        ? files.image
        : [];
    return this.detectionService.scanByUpload(list);
  }

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
