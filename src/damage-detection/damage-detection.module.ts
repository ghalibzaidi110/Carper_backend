import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DamageDetectionService } from './damage-detection.service';
import { DamageDetectionController } from './damage-detection.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [HttpModule, CloudinaryModule],
  controllers: [DamageDetectionController],
  providers: [DamageDetectionService],
  exports: [DamageDetectionService],
})
export class DamageDetectionModule {}
