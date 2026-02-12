import { Module } from '@nestjs/common';
import { CarListingsService } from './car-listings.service';
import { CarListingsController } from './car-listings.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [CarListingsController],
  providers: [CarListingsService],
  exports: [CarListingsService],
})
export class CarListingsModule {}
