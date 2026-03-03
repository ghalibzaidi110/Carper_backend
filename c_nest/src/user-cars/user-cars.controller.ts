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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserCarsService } from './user-cars.service';
import { RegisterCarDto, UpdateCarDto } from './dto';
import { CurrentUser, Roles } from '../common/decorators';
import { AccountType } from '@prisma/client';

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

  @Post('bulk-import')
  @Roles(AccountType.CAR_RENTAL)
  @ApiOperation({
    summary: 'Bulk import cars from CSV (Rental Business only)',
    description:
      'Upload a CSV file to import multiple cars. CSV format: registrationNumber,manufacturer,modelName,year,variant,color,mileage,condition,purchasePrice,vinNumber,purchaseDate',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with car data',
        },
        validateOnly: {
          type: 'boolean',
          description: 'If true, only validates without importing',
          default: false,
        },
      },
    },
  })
  async bulkImport(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('validateOnly') validateOnly?: string,
  ) {
    if (!file) {
      throw new Error('CSV file is required');
    }

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new Error('File must be a CSV file');
    }

    const csvData = file.buffer.toString('utf-8');
    const shouldValidateOnly = validateOnly === 'true';

    return this.userCarsService.bulkImportCars(userId, csvData, shouldValidateOnly);
  }
}
