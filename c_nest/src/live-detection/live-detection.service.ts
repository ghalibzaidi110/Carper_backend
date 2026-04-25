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

interface Vendor {
  name: string;
  price: number;
  currency: 'PKR' | 'USD';
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

interface VendorSearchResult {
  vendors: Vendor[];
  fallbackEstimate: {
    min: number;
    max: number;
    currency: 'PKR';
    partName: string;
    note: string;
  } | null;
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

  // ─── A) Vendor search via SerpApi (Google Shopping) ──────────────────────

  async searchVendors(dto: VendorSearchDto): Promise<VendorSearchResult> {
    const config = SEARCH_CONFIG[dto.damageType];
    if (!config) {
      return { vendors: [], fallbackEstimate: null };
    }

    const query = this.buildQuery(config, dto.panelLocation, dto.vehicle);
    const cacheKey = `${dto.damageType}|${query}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.CACHE_TTL) {
      return cached.data;
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
        .map((r): Vendor => ({
          name: r.source || 'Unknown',
          price: r.extracted_price,
          currency: typeof r.price === 'string' && r.price.startsWith('Rs') ? 'PKR' : 'USD',
          url: r.product_link || r.link || '',
          rating: r.rating || 0,
          reviews: r.reviews || 0,
          inStock: !r.extensions?.some((e: string) => /out of stock/i.test(e)),
          partName: r.title?.substring(0, 80) || config.partName,
          deliveryDays: this.extractDelivery(r),
          thumbnail: r.thumbnail || null,
          oldPrice: r.extracted_old_price || null,
          badge: r.tag || r.badge || null,
        }))
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);

      const result: VendorSearchResult =
        vendors.length > 0
          ? { vendors, fallbackEstimate: null }
          : this.makeFallback(config, 'No priced products found');

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

  // ─── C) Health: report Python and SerpApi availability ──────────────────

  async getHealth(): Promise<any> {
    let pythonHealthy = false;
    let costModelLoaded = false;

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
    } catch {
      costModelLoaded = false;
    }

    return {
      pythonHealthy,
      costModelLoaded,
      serpApiConfigured: !!this.serpApiKey,
      vendorCacheSize: this.cache.size,
      pythonUrl: this.pythonUrl,
    };
  }
}
