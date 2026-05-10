import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';

import { LiveDetectionController } from './live-detection.controller';
import { LiveDetectionService } from './live-detection.service';
import { LiveDetectionScansService } from './scans.service';

@Module({
  imports: [HttpModule, ConfigModule, CloudinaryModule],
  controllers: [LiveDetectionController],
  providers: [LiveDetectionService, LiveDetectionScansService],
  exports: [LiveDetectionService, LiveDetectionScansService],
})
export class LiveDetectionModule {}
