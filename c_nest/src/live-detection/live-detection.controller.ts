import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../common/decorators';
import { CostEstimateDto, VendorSearchDto } from './dto';
import { LiveDetectionService } from './live-detection.service';

@ApiTags('Live Detection')
@Controller('live-detection')
export class LiveDetectionController {
  constructor(private readonly service: LiveDetectionService) {}

  @Public()
  @Post('vendors')
  @ApiOperation({
    summary: 'Search replacement-part vendors via SerpApi (Google Shopping)',
    description:
      'Used by the live-detection page when a user logs a parts-replacement damage ' +
      '(glass_shatter, tire_flat, lamp_broken). Falls back to a static PKR range when ' +
      'SerpApi is unavailable. Results are cached in-memory for 10 minutes.',
  })
  searchVendors(@Body() dto: VendorSearchDto) {
    return this.service.searchVendors(dto);
  }

  @Public()
  @Post('estimate')
  @ApiOperation({
    summary: 'Predict repair cost in PKR (proxy to Python ML model)',
    description:
      'Used by the live-detection page when a user logs a repair-type damage ' +
      '(dent, scratch, crack). Forwards the request to the c_python /cost-estimate ' +
      'endpoint and returns the response unchanged.',
  })
  estimateCost(@Body() dto: CostEstimateDto) {
    return this.service.estimateCost(dto);
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Report Python service + SerpApi availability for live detection',
  })
  health() {
    return this.service.getHealth();
  }
}
