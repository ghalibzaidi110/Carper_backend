import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserCarsService } from './user-cars.service';
import { RegisterCarDto, UpdateCarDto } from './dto';
import { CurrentUser } from '../common/decorators';

@ApiTags('User Cars')
@ApiBearerAuth()
@Controller('user-cars')
export class UserCarsController {
  constructor(private userCarsService: UserCarsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new car (must be from catalog)' })
  async registerCar(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterCarDto,
  ) {
    return this.userCarsService.registerCar(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all your registered cars' })
  async findAllMyCars(@CurrentUser('id') userId: string) {
    return this.userCarsService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get car details' })
  async findOne(
    @Param('id') carId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.userCarsService.findOne(carId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update car details (color, mileage, condition)' })
  async update(
    @Param('id') carId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCarDto,
  ) {
    return this.userCarsService.update(carId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete car (soft delete, must have no active listings)' })
  async remove(
    @Param('id') carId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.userCarsService.remove(carId, userId);
  }

  @Get(':id/has-registration-images')
  @ApiOperation({ summary: 'Check if car has all 4 registration images' })
  async checkRegistrationImages(@Param('id') carId: string) {
    const hasImages = await this.userCarsService.hasRegistrationImages(carId);
    return { hasRegistrationImages: hasImages };
  }
}
