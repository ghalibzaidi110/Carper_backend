import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { CarCatalogService } from './car-catalog.service';
import { CreateCatalogDto, UpdateCatalogDto, CatalogFilterDto } from './dto';
import { Roles, Public } from '../common/decorators';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Car Catalog')
@Controller('car-catalog')
export class CarCatalogController {
  constructor(
    private catalogService: CarCatalogService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // ─── PUBLIC ENDPOINTS ─────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse car catalog (public)' })
  async findAll(@Query() filters: CatalogFilterDto) {
    return this.catalogService.findAll(filters);
  }

  @Public()
  @Get('manufacturers')
  @ApiOperation({ summary: 'Get list of manufacturers' })
  async getManufacturers() {
    return this.catalogService.getManufacturers();
  }

  @Public()
  @Get('manufacturers/:manufacturer/models')
  @ApiOperation({ summary: 'Get models by manufacturer' })
  async getModelsByManufacturer(@Param('manufacturer') manufacturer: string) {
    return this.catalogService.getModelsByManufacturer(manufacturer);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get catalog entry details' })
  async findOne(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  // ─── ADMIN ENDPOINTS ──────────────────────────────────────────

  @Post()
  @Roles(AccountType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add new car to catalog (Admin)' })
  async create(@Body() dto: CreateCatalogDto) {
    return this.catalogService.create(dto);
  }

  @Post('bulk')
  @Roles(AccountType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk add cars to catalog (Admin)' })
  async bulkCreate(@Body() entries: CreateCatalogDto[]) {
    return this.catalogService.bulkCreate(entries);
  }

  @Patch(':id')
  @Roles(AccountType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update catalog entry (Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCatalogDto) {
    return this.catalogService.update(id, dto);
  }

  @Delete(':id')
  @Roles(AccountType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete/deactivate catalog entry (Admin)' })
  async remove(@Param('id') id: string) {
    return this.catalogService.remove(id);
  }

  @Post(':id/images')
  @Roles(AccountType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload catalog image (Admin)' })
  async uploadImage(
    @Param('id') catalogId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: string,
    @Body('altText') altText: string,
  ) {
    const result = await this.cloudinaryService.uploadImage(
      file,
      'catalog-images',
    );
    return this.catalogService.addImage(
      catalogId,
      result.secure_url,
      isPrimary === 'true',
      altText,
    );
  }
}
