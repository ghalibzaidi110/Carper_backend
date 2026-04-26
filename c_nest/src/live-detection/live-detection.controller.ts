import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

import { Public } from '../common/decorators';
import { CostEstimateDto, VendorSearchDto } from './dto';
import { LiveDetectionService } from './live-detection.service';

@ApiTags('Live Detection')
@Controller('live-detection')
export class LiveDetectionController {
  constructor(private readonly service: LiveDetectionService) {}

  @Public()
  @Post('vendors')
  // Tight limit: each call hits SerpApi (paid quota). Even with the 10-min
  // in-memory cache, 30 unique queries per minute is more than a real user
  // ever needs. Override the global default which is too permissive here.
  @Throttle({
    short: { ttl: 1_000, limit: 2 },
    medium: { ttl: 60_000, limit: 30 },
  })
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
  // Cost estimate hits the Python ML service. Looser than vendors (no per-
  // call $$ cost) but still bounded so a tight loop doesn't pin Python's CPU.
  @Throttle({
    medium: { ttl: 60_000, limit: 60 },
  })
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
  // Health checks (probes, dashboards) shouldn't be throttled.
  @SkipThrottle()
  @ApiOperation({
    summary: 'Report Python service + SerpApi availability for live detection',
  })
  health() {
    return this.service.getHealth();
  }

  @Public()
  @Get('known-vehicles')
  // Static catalogue read — no need to throttle.
  @SkipThrottle()
  @ApiOperation({
    summary:
      'Canonical list of vehicles the cost model recognizes. ' +
      'Frontend should validate its hardcoded dropdown against this.',
  })
  knownVehicles() {
    return this.service.getKnownVehicles();
  }
}
