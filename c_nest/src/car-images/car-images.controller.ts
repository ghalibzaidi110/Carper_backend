import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ImageCategory } from '@prisma/client';
import { CarImagesService } from './car-images.service';
import { CurrentUser } from '../common/decorators';

@ApiTags('Car Images')
@ApiBearerAuth()
@Controller('car-images')
export class CarImagesController {
  constructor(private carImagesService: CarImagesService) {}

  // ─── REGISTRATION IMAGES (Permanent, 4 required) ─────────────

  @Post(':carId/registration')
  @ApiOperation({
    summary: 'Upload 4 registration images (PERMANENT - cannot be changed)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'front', maxCount: 1 },
      { name: 'back', maxCount: 1 },
      { name: 'left', maxCount: 1 },
      { name: 'right', maxCount: 1 },
    ]),
  )
  async uploadRegistrationImages(
    @Param('carId') carId: string,
    @CurrentUser('id') userId: string,
    @UploadedFiles()
    files: {
      front: Express.Multer.File[];
      back: Express.Multer.File[];
      left: Express.Multer.File[];
      right: Express.Multer.File[];
    },
  ) {
    return this.carImagesService.uploadRegistrationImages(carId, userId, files);
  }

  // ─── PERIODIC INSPECTION IMAGES (Versioned) ───────────────────

  @Post(':carId/periodic')
  @ApiOperation({
    summary: 'Upload periodic inspection images (4 angles, creates new version)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'front', maxCount: 1 },
      { name: 'back', maxCount: 1 },
      { name: 'left', maxCount: 1 },
      { name: 'right', maxCount: 1 },
    ]),
  )
  async uploadPeriodicImages(
    @Param('carId') carId: string,
    @CurrentUser('id') userId: string,
    @UploadedFiles()
    files: {
      front: Express.Multer.File[];
      back: Express.Multer.File[];
      left: Express.Multer.File[];
      right: Express.Multer.File[];
    },
  ) {
    return this.carImagesService.uploadPeriodicImages(carId, userId, files);
  }

  // ─── SINGLE IMAGE UPLOAD (damage/listing) ─────────────────────

  @Post(':carId/upload')
  @ApiOperation({ summary: 'Upload a single image (damage detection or listing)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async uploadSingleImage(
    @Param('carId') carId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category: ImageCategory = ImageCategory.DAMAGE_DETECTION,
  ) {
    return this.carImagesService.uploadSingleImage(carId, userId, file, category);
  }

  // ─── GET ALL IMAGES ───────────────────────────────────────────

  @Get(':carId')
  @ApiOperation({ summary: 'Get all images for a car' })
  async getCarImages(
    @Param('carId') carId: string,
    @Query('currentOnly') currentOnly: string,
  ) {
    return this.carImagesService.getCarImages(carId, currentOnly === 'true');
  }

  // ─── GET REGISTRATION IMAGES ──────────────────────────────────

  @Get(':carId/registration')
  @ApiOperation({ summary: 'Get registration (baseline) images' })
  async getRegistrationImages(@Param('carId') carId: string) {
    return this.carImagesService.getRegistrationImages(carId);
  }

  // ─── GET INSPECTION HISTORY ───────────────────────────────────

  @Get(':carId/inspection-history')
  @ApiOperation({ summary: 'Get all periodic inspection versions' })
  async getInspectionHistory(@Param('carId') carId: string) {
    return this.carImagesService.getInspectionHistory(carId);
  }
}
