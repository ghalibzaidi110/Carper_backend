import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { CostEstimateDto, VendorSearchDto, VehicleDto } from './dto';
import { PANEL_QUERY_MAP, SEARCH_CONFIG, SearchConfig } from './constants/search-config';

// Approximate USD → PKR rate. Updated periodically; good enough for
// ballpark part-price estimates. Override via USD_TO_PKR env var.
const USD_TO_PKR = parseFloat(process.env.USD_TO_PKR || '278');

export interface Vendor {
  name: string;
  price: number;
  currency: 'PKR';
  url: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  partName: string;
  deliveryDays: number | null;
  thumbnail: string | null;
  oldPrice: number | null;
  badge: string | null;
}

export interface VendorFallback {
  min: number;
  max: number;
  currency: 'PKR';
  partName: string;
  note: string;
}

export interface VendorSearchResult {
  vendors: Vendor[];
  fallbackEstimate: VendorFallback | null;
}

interface CacheEntry {
  data: VendorSearchResult;
  time: number;
}

@Injectable()
export class LiveDetectionService {
  private readonly logger = new Logger(LiveDetectionService.name);
  private readonly serpApiKey: string;
  private readonly pythonUrl: string;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  // Hard cap on cache size — protects against attackers spamming unique
  // queries to grow the Map until we OOM. When we hit the cap we prune.
  private readonly CACHE_MAX_ENTRIES = 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.serpApiKey = this.configService.get<string>('SERPAPI_KEY', '') ?? '';
    this.pythonUrl = this.configService.get<string>(
      'DAMAGE_DETECTION_SERVICE_URL',
      'http://localhost:8000',
    );
    if (!this.serpApiKey) {
      this.logger.warn(
        'SERPAPI_KEY not set; vendor search will return fallback PKR ranges only',
      );
    }
  }

  /**
   * Drop expired entries. If still over the size cap after that, drop the
   * oldest entries until we're under cap. Cheap to call — O(N) over the
   * Map, only fires when we hit CACHE_MAX_ENTRIES.
   */
  private pruneCache(): void {
    const now = Date.now();
    const before = this.cache.size;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.time >= this.CACHE_TTL) this.cache.delete(key);
    }
    if (this.cache.size > this.CACHE_MAX_ENTRIES) {
      // Map iteration order is insertion order — drop oldest first.
      const toDrop = this.cache.size - this.CACHE_MAX_ENTRIES;
      let dropped = 0;
      for (const key of this.cache.keys()) {
        this.cache.delete(key);
        if (++dropped >= toDrop) break;
      }
    }
    if (this.cache.size !== before) {
      this.logger.debug(
        `Vendor cache pruned: ${before} → ${this.cache.size} entries`,
      );
    }
  }

  // ─── A) Vendor search via SerpApi (Google Shopping) ──────────────────────

  async searchVendors(dto: VendorSearchDto): Promise<VendorSearchResult> {
    const config = SEARCH_CONFIG[dto.damageType];
    if (!config) {
      return { vendors: [], fallbackEstimate: null };
    }

    const query = this.buildQuery(config, dto.panelLocation, dto.vehicle);
    const cacheKey = `${dto.damageType}|${query}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      if (Date.now() - cached.time < this.CACHE_TTL) {
        return cached.data;
      }
      // Expired — drop now so the Map doesn't accumulate stale entries.
      this.cache.delete(cacheKey);
    }

    if (!this.serpApiKey) {
      return this.makeFallback(
        config,
        'SERPAPI_KEY not configured — set it in c_nest/.env',
      );
    }

    try {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google_shopping');
      url.searchParams.set('q', query);
      url.searchParams.set('hl', 'en');
      url.searchParams.set('api_key', this.serpApiKey);

      this.logger.log(`Vendor search [${dto.damageType}]: "${query}"`);
      const response = await firstValueFrom(
        this.httpService.get(url.toString(), { timeout: 30000 }),
      );

      const data = response.data;
      if (data?.error) {
        this.logger.error(`SerpApi error: ${data.error}`);
        return this.makeFallback(config, data.error);
      }

      const results: any[] = data?.shopping_results || [];
      const vendors: Vendor[] = results
        .filter((r) => r.extracted_price && r.extracted_price > 0)
        .map((r): Vendor => {
          const isAlreadyPKR = typeof r.price === 'string' && r.price.startsWith('Rs');
          const rawPrice: number = r.extracted_price;
          const price = isAlreadyPKR ? rawPrice : Math.round(rawPrice * USD_TO_PKR);
          const oldPrice = r.extracted_old_price
            ? (isAlreadyPKR ? r.extracted_old_price : Math.round(r.extracted_old_price * USD_TO_PKR))
            : null;
          return {
            name: r.source || 'Unknown',
            price,
            currency: 'PKR',
            url: r.product_link || r.link || '',
            rating: r.rating || 0,
            reviews: r.reviews || 0,
            inStock: !r.extensions?.some((e: string) => /out of stock/i.test(e)),
            partName: r.title?.substring(0, 80) || config.partName,
            deliveryDays: this.extractDelivery(r),
            thumbnail: r.thumbnail || null,
            oldPrice,
            badge: r.tag || r.badge || null,
          };
        })
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);

      const result: VendorSearchResult =
        vendors.length > 0
          ? { vendors, fallbackEstimate: null }
          : this.makeFallback(config, 'No priced products found');

      // Bound the cache. Prune (TTL + size cap) once we hit the cap so
      // a flood of unique queries can't grow the Map without limit.
      if (this.cache.size >= this.CACHE_MAX_ENTRIES) {
        this.pruneCache();
      }
      this.cache.set(cacheKey, { data: result, time: Date.now() });
      return result;
    } catch (err: any) {
      this.logger.error(`Vendor search failed: ${err?.message ?? err}`);
      return this.makeFallback(config, `SerpApi unreachable: ${err?.message ?? err}`);
    }
  }

  private buildQuery(
    config: SearchConfig,
    panelLocation?: string,
    vehicle?: VehicleDto,
  ): string {
    const panelPart = panelLocation ? PANEL_QUERY_MAP[panelLocation] || '' : '';
    return [
      vehicle?.year ?? '',
      vehicle?.make ?? '',
      vehicle?.model ?? '',
      panelPart,
      config.query,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private makeFallback(config: SearchConfig | undefined, note: string): VendorSearchResult {
    if (!config) return { vendors: [], fallbackEstimate: null };
    return {
      vendors: [],
      fallbackEstimate: {
        min: config.fallback.min,
        max: config.fallback.max,
        currency: 'PKR',
        partName: config.partName,
        note,
      },
    };
  }

  private extractDelivery(r: any): number | null {
    const text = `${r.delivery || ''} ${r.extensions?.join(' ') || ''}`;
    if (/same.?day|next.?day/i.test(text)) return 1;
    if (/1.?day/i.test(text)) return 1;
    if (/2.?day/i.test(text)) return 2;
    if (/free.?(delivery|shipping)/i.test(text)) return 3;
    return null;
  }

  // ─── B) Cost estimate — proxy to c_python /cost-estimate ────────────────

  async estimateCost(dto: CostEstimateDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.pythonUrl}/cost-estimate`, dto, {
          timeout: 30000,
        }),
      );
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || err?.message || String(err);
      this.logger.error(`Cost estimate proxy failed (status=${status}): ${detail}`);
      throw new InternalServerErrorException(
        `Cost estimation service unavailable: ${detail}`,
      );
    }
  }

  // ─── D) Known vehicles — canonical list from the cost model ────────────

  /**
   * F-5: Expose Python's `KNOWN_MAKES` / `KNOWN_MODELS` / `KNOWN_PANELS`
   * to the frontend so it can validate its own hardcoded vehicle list
   * against the source of truth (the cost model's training vocabulary).
   */
  async getKnownVehicles(): Promise<{
    modelVersion: string | null;
    makes: string[];
    models: string[];
    panels: string[];
  }> {
    try {
      const r = await firstValueFrom(
        this.httpService.get(`${this.pythonUrl}/cost/known-vehicles`, {
          timeout: 2000,
        }),
      );
      return {
        modelVersion: r.data?.model_version ?? null,
        makes: r.data?.makes ?? [],
        models: r.data?.models ?? [],
        panels: r.data?.panels ?? [],
      };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch known-vehicles: ${err?.message ?? err}`);
      return { modelVersion: null, makes: [], models: [], panels: [] };
    }
  }

  // ─── C) Health: report Python and SerpApi availability ──────────────────

  async getHealth(): Promise<any> {
    let pythonHealthy = false;
    let costModelLoaded = false;
    let costModelVersion: string | null = null;

    try {
      const r1 = await firstValueFrom(
        this.httpService.get(`${this.pythonUrl}/health`, { timeout: 2000 }),
      );
      pythonHealthy = r1.data?.status === 'ok';
    } catch {
      pythonHealthy = false;
    }

    try {
      const r2 = await firstValueFrom(
        this.httpService.get(`${this.pythonUrl}/cost/health`, { timeout: 2000 }),
      );
      costModelLoaded = !!r2.data?.model_loaded;
      costModelVersion = r2.data?.model_version ?? null;
    } catch {
      costModelLoaded = false;
    }

    return {
      pythonHealthy,
      costModelLoaded,
      costModelVersion,
      serpApiConfigured: !!this.serpApiKey,
      vendorCacheSize: this.cache.size,
      pythonUrl: this.pythonUrl,
    };
  }
}
