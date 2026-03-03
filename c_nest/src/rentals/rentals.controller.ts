import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import {
  CreateRentalDto,
  CompleteRentalDto,
  RentalFilterDto,
} from './dto';
import { CurrentUser, RequireVerification, Roles } from '../common/decorators';

@ApiTags('Rentals')
@Controller('rentals')
@ApiBearerAuth()
export class RentalsController {
  constructor(private rentalsService: RentalsService) {}

  @Post()
  @Roles('CAR_RENTAL')
  @RequireVerification()
  @ApiOperation({ summary: 'Create a new rental (CAR_RENTAL only)' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRentalDto,
  ) {
    return this.rentalsService.create(userId, dto);
  }

  @Get()
  @Roles('CAR_RENTAL')
  @ApiOperation({ summary: 'Get all my rentals' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() filters: RentalFilterDto,
  ) {
    return this.rentalsService.findAll(userId, filters);
  }

  @Get('stats')
  @Roles('CAR_RENTAL')
  @ApiOperation({ summary: 'Get business rental stats' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.rentalsService.getBusinessStats(userId);
  }

  @Get(':id')
  @Roles('CAR_RENTAL')
  @ApiOperation({ summary: 'Get rental details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rentalsService.findOne(id, userId);
  }

  @Patch(':id/complete')
  @Roles('CAR_RENTAL')
  @ApiOperation({ summary: 'Complete a rental (car returned)' })
  async complete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteRentalDto,
  ) {
    return this.rentalsService.completeRental(id, userId, dto);
  }

  @Patch(':id/cancel')
  @Roles('CAR_RENTAL')
  @ApiOperation({ summary: 'Cancel a rental' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rentalsService.cancelRental(id, userId);
  }
}
