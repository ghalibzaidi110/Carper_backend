import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  UploadedFiles,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DamageDetectionService } from './damage-detection.service';
import { RunDetectionDto, RunDetectionOnCarDto } from './dto';
import { CurrentUser, RequireVerification, Public } from '../common/decorators';
import { createJob, getJob, updateJob } from './detection-job.store';

@ApiTags('Damage Detection')
@Controller('damage-detection')
@ApiBearerAuth()
export class DamageDetectionController {
  constructor(private detectionService: DamageDetectionService) {}

  @Post('scan')
  @Public()
  @Throttle({
    short: { ttl: 1_000, limit: 3 },
    medium: { ttl: 60_000, limit: 20 },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload image(s) for damage detection (sync)',
    description:
      'Synchronous scan — blocks until all images are processed. ' +
      'For large batches, prefer POST /scan-async which returns immediately.',
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

  @Post('scan-async')
  @Public()
  @HttpCode(202)
  @Throttle({
    short: { ttl: 1_000, limit: 3 },
    medium: { ttl: 60_000, limit: 20 },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload image(s) for damage detection (async)',
    description:
      'Returns 202 with a jobId immediately. Poll GET /scan-async/:jobId ' +
      'until status is "completed" or "failed". Jobs expire after 10 minutes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async scanByUploadAsync(
    @UploadedFiles() files: { images?: Express.Multer.File[]; image?: Express.Multer.File[] },
  ) {
    const list = files?.images?.length
      ? files.images
      : files?.image?.length
        ? files.image
        : [];

    const job = createJob();
    updateJob(job.id, { status: 'processing' });

    // Fire-and-forget: process in background, don't await
    this.detectionService
      .scanByUpload(list)
      .then((result) => {
        updateJob(job.id, { status: 'completed', result });
      })
      .catch((err) => {
        updateJob(job.id, {
          status: 'failed',
          error: err?.message ?? 'Detection failed',
        });
      });

    return { jobId: job.id, status: 'processing' };
  }

  @Get('scan-async/:jobId')
  @Public()
  @ApiOperation({
    summary: 'Poll async scan job status',
    description: 'Returns job status + result when completed.',
  })
  async getScanJob(@Param('jobId') jobId: string) {
    const job = getJob(jobId);
    if (!job) {
      throw new NotFoundException('Job not found or expired');
    }
    return job;
  }

  @Post('image')
  @RequireVerification()
  @Throttle({ medium: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Run damage detection on a single image' })
  async detectOnImage(
    @Body() dto: RunDetectionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.detectionService.detectOnImage(dto.imageId, userId);
  }

  @Post('car')
  @RequireVerification()
  @Throttle({ medium: { ttl: 60_000, limit: 10 } })
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
