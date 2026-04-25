import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LiveDetectionController } from './live-detection.controller';
import { LiveDetectionService } from './live-detection.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [LiveDetectionController],
  providers: [LiveDetectionService],
  exports: [LiveDetectionService],
})
export class LiveDetectionModule {}
