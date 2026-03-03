import { Module } from '@nestjs/common';
import { UserCarsService } from './user-cars.service';
import { UserCarsController } from './user-cars.controller';

@Module({
  controllers: [UserCarsController],
  providers: [UserCarsService],
  exports: [UserCarsService],
})
export class UserCarsModule {}
