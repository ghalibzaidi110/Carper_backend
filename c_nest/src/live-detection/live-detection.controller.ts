import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

import { CurrentUser, Public } from '../common/decorators';
import { CostEstimateDto, SaveScanDto, VendorSearchDto } from './dto';
import { LiveDetectionService } from './live-detection.service';
import { LiveDetectionScansService } from './scans.service';

@ApiTags('Live Detection')
@Controller('live-detection')
export class LiveDetectionController {
  constructor(
    private readonly service: LiveDetectionService,
    private readonly scansService: LiveDetectionScansService,
  ) {}

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

  // ─────────────────────────────────────────────────────────────────────
  // SCAN PERSISTENCE — protected by global JWT guard (no @Public() here)
  // ─────────────────────────────────────────────────────────────────────

  @Post('scans')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  // Save is rare per user (one per finished scan) but each call uploads
  // ~5–10 images to Cloudinary, so the lower-bound matters. 10/min is
  // generous for any honest user, throttles a runaway client.
  @Throttle({ medium: { ttl: 60_000, limit: 10 } })
  // AnyFilesInterceptor accepts variable-arity multipart bodies — the
  // frontend names each image field `entry-<id>` so the service can
  // match images back to their LogEntry by id.
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Save a finished scan (with damage images) to the user history',
    description:
      'multipart/form-data: a JSON `payload` field (SaveScanDto) plus N ' +
      'image fields named `entry-<id>` matching the entries[].id values. ' +
      'Images are uploaded to Cloudinary and their URLs embedded into ' +
      'detectionsJson.',
  })
  saveScan(
    @CurrentUser('id') userId: string,
    @Body('payload') payloadRaw: string | SaveScanDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // When sent as multipart, the JSON body lands as a string under the
    // `payload` field. When sent as application/json (test/manual
    // invocations), it lands as an already-parsed object.
    let dto: SaveScanDto;
    if (typeof payloadRaw === 'string') {
      try {
        dto = JSON.parse(payloadRaw) as SaveScanDto;
      } catch {
        throw new Error('payload field must be valid JSON');
      }
    } else {
      dto = payloadRaw;
    }
    return this.scansService.saveScan(userId, dto, files);
  }

  @Get('scans/me')
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({
    summary: "List the current user's saved scans (newest first, paginated)",
  })
  listMyScans(
    @CurrentUser('id') userId: string,
    @Query('take') takeRaw?: string,
    @Query('cursor') cursor?: string,
  ) {
    const take = takeRaw ? Number(takeRaw) : 50;
    return this.scansService.listMine(userId, Number.isFinite(take) ? take : 50, cursor);
  }

  @Get('scans/:id')
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'View a single saved scan in full (with detectionsJson)' })
  getScan(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) scanId: string,
  ) {
    return this.scansService.getOne(userId, scanId);
  }

  @Delete('scans/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a saved scan and its Cloudinary images',
  })
  deleteScan(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) scanId: string,
  ) {
    return this.scansService.deleteOne(userId, scanId);
  }
}
