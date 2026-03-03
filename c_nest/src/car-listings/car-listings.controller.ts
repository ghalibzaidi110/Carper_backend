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
import { CarListingsService } from './car-listings.service';
import {
  CreateListingDto,
  UpdateListingDto,
  UpdateListingStatusDto,
  ListingFilterDto,
  ContactSellerDto,
} from './dto';
import { CurrentUser, Public, RequireVerification } from '../common/decorators';

@ApiTags('Car Listings (Marketplace)')
@Controller('car-listings')
export class CarListingsController {
  constructor(private listingsService: CarListingsService) {}

  // ─── PUBLIC ENDPOINTS ─────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse marketplace listings (public)' })
  async findAll(@Query() filters: ListingFilterDto) {
    return this.listingsService.findAll(filters);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get listing details (public)' })
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  // ─── AUTHENTICATED ENDPOINTS ──────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @RequireVerification()
  @ApiOperation({ summary: 'Create a new listing (CNIC verification required)' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateListingDto,
  ) {
    return this.listingsService.create(userId, dto);
  }

  @Get('my/listings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my listings' })
  async getMyListings(@CurrentUser('id') userId: string) {
    return this.listingsService.getMyListings(userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing (price, title, description)' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, userId, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing status (sold, inactive)' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateListingStatusDto,
  ) {
    return this.listingsService.updateStatus(id, userId, dto);
  }

  @Post(':id/contact')
  @ApiBearerAuth()
  @RequireVerification()
  @ApiOperation({ summary: 'Contact seller via email (CNIC verification required)' })
  async contactSeller(
    @Param('id') id: string,
    @Body() dto: ContactSellerDto,
  ) {
    return this.listingsService.contactSeller(id, dto);
  }
}
