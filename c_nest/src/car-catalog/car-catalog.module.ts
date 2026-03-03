import { Module } from '@nestjs/common';
import { CarCatalogService } from './car-catalog.service';
import { CarCatalogController } from './car-catalog.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [CarCatalogController],
  providers: [CarCatalogService],
  exports: [CarCatalogService],
})
export class CarCatalogModule {}
