import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { CurrentUser, RequireVerification } from '../common/decorators';

@ApiTags('PDF Reports')
@Controller('reports')
@ApiBearerAuth()
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Get('damage/:carId')
  @RequireVerification()
  @ApiOperation({ summary: 'Download damage detection report PDF' })
  async getDamageReport(
    @Param('carId') carId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generateDamageReport(carId, userId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=damage-report-${carId}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('rental/:rentalId')
  @RequireVerification()
  @ApiOperation({ summary: 'Download rental summary report PDF' })
  async getRentalReport(
    @Param('rentalId') rentalId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generateRentalReport(rentalId, userId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=rental-report-${rentalId}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
