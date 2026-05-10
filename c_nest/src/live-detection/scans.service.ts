import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

import { SaveScanDto } from './dto';

/** Damage class names that map to per-type count columns on DamageScan. */
const DAMAGE_TYPES = [
  'dent',
  'scratch',
  'crack',
  'glass_shatter',
  'lamp_broken',
  'tire_flat',
] as const;
type DamageType = (typeof DAMAGE_TYPES)[number];

const COUNT_COLUMNS: Record<DamageType, keyof Prisma.DamageScanUncheckedCreateInput> = {
  dent: 'dentCount',
  scratch: 'scratchCount',
  crack: 'crackCount',
  glass_shatter: 'glassShatterCount',
  lamp_broken: 'lampBrokenCount',
  tire_flat: 'tireFlatCount',
};

/** Summary projection used by the list endpoint. Excludes the heavy
 * `detectionsJson` blob so listing 50 scans stays under ~10 KB. */
const SUMMARY_SELECT = {
  id: true,
  userId: true,
  carId: true,
  vehicleMake: true,
  vehicleModel: true,
  vehicleYear: true,
  vehicleCategory: true,
  totalCostPkr: true,
  totalLowPkr: true,
  totalHighPkr: true,
  entryCount: true,
  failedCount: true,
  dentCount: true,
  scratchCount: true,
  crackCount: true,
  glassShatterCount: true,
  lampBrokenCount: true,
  tireFlatCount: true,
  costModelVersion: true,
  damageModelVersion: true,
  coverImageUrl: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class LiveDetectionScansService {
  private readonly logger = new Logger(LiveDetectionScansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Persist a finished scan. Uploads each damage image (if any) to
   * Cloudinary in parallel, injects the resulting URL into its entry,
   * and writes one DamageScan row.
   *
   * The save is atomic at the DB level: if any image upload fails we
   * roll back any uploads that already succeeded (best-effort delete)
   * and throw before writing the row, so we never leave the user with
   * an orphan DB record pointing at half-uploaded images.
   *
   * @param userId — from `@CurrentUser('id')`
   * @param dto    — vehicle/totals/entries metadata
   * @param files  — multipart files keyed by entry id (`entry-<id>`)
   */
  async saveScan(
    userId: string,
    dto: SaveScanDto,
    files: Express.Multer.File[] | undefined,
  ): Promise<{ id: string }> {
    if (!Array.isArray(dto.entries) || dto.entries.length === 0) {
      throw new BadRequestException('Scan must contain at least one entry');
    }

    // If carId was supplied, confirm it belongs to this user. Otherwise
    // a malicious payload could attach a saved scan to someone else's
    // car record.
    if (dto.carId) {
      const car = await this.prisma.userCar.findUnique({ where: { id: dto.carId } });
      if (!car || car.userId !== userId) {
        throw new ForbiddenException(
          "Provided carId doesn't belong to the authenticated user",
        );
      }
    }

    // Build a quick lookup: entryId → file. Multer's `fieldname` for
    // each uploaded image is `entry-<id>` (frontend convention). Any
    // entry without a matching file will be saved with imageUrl = null.
    const fileByEntryId = new Map<number, Express.Multer.File>();
    for (const f of files ?? []) {
      const m = /^entry-(\d+)$/.exec(f.fieldname);
      if (!m) {
        this.logger.warn(`Ignoring multipart field with unexpected name: ${f.fieldname}`);
        continue;
      }
      fileByEntryId.set(Number(m[1]), f);
    }

    // ── Upload all images in parallel ──
    // Track uploaded public IDs so we can roll back on a later failure.
    const uploadedPublicIds: string[] = [];
    const folder = `live-detection/${userId}`;
    const entriesWithImages: Array<Record<string, unknown>> = [];

    try {
      const uploads = dto.entries.map(async (entry) => {
        const file = fileByEntryId.get(entry.id);
        if (!file) {
          // No image captured for this entry — keep it but flag it.
          return { ...(entry as unknown as Record<string, unknown>), imageUrl: null, thumbnailUrl: null };
        }
        const result = await this.cloudinary.uploadImage(file, folder, 5);
        uploadedPublicIds.push(result.public_id);
        return {
          ...(entry as unknown as Record<string, unknown>),
          imageUrl: result.secure_url,
          thumbnailUrl: this.cloudinary.generateThumbnailUrl(result.secure_url),
        };
      });
      entriesWithImages.push(...(await Promise.all(uploads)));
    } catch (err) {
      // Roll back — delete any images we already uploaded so we don't
      // leave orphans in Cloudinary. Failures here are silent: we can't
      // do much, but the user-facing error below is the right signal.
      this.logger.error(
        `Image upload failed mid-save (rolling back ${uploadedPublicIds.length} images): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      await Promise.allSettled(
        uploadedPublicIds.map((id) => this.cloudinary.deleteImage(id)),
      );
      throw err instanceof Error
        ? new BadRequestException(`Image upload failed: ${err.message}`)
        : new BadRequestException('Image upload failed');
    }

    // ── Compute aggregate counts ──
    const counts = this.tallyDamageCounts(dto.entries);
    const failedCount = dto.entries.filter(
      (e) => (e as unknown as { estimateError?: string | null }).estimateError,
    ).length;

    // First entry's image becomes the cover thumbnail.
    const coverImageUrl =
      (entriesWithImages.find((e) => e.thumbnailUrl)?.thumbnailUrl as string | null) ??
      (entriesWithImages.find((e) => e.imageUrl)?.imageUrl as string | null) ??
      null;

    // ── Persist ──
    const created = await this.prisma.damageScan.create({
      data: {
        userId,
        carId: dto.carId ?? null,
        vehicleMake: dto.vehicleMake,
        vehicleModel: dto.vehicleModel,
        vehicleYear: dto.vehicleYear,
        vehicleCategory: dto.vehicleCategory ?? null,
        totalCostPkr: dto.totalCostPkr,
        totalLowPkr: dto.totalLowPkr,
        totalHighPkr: dto.totalHighPkr,
        entryCount: dto.entries.length,
        failedCount,
        dentCount: counts.dent,
        scratchCount: counts.scratch,
        crackCount: counts.crack,
        glassShatterCount: counts.glass_shatter,
        lampBrokenCount: counts.lamp_broken,
        tireFlatCount: counts.tire_flat,
        costModelVersion: dto.costModelVersion ?? null,
        damageModelVersion: dto.damageModelVersion ?? null,
        detectionsJson: entriesWithImages as unknown as Prisma.InputJsonValue,
        coverImageUrl,
        notes: dto.notes ?? null,
      },
      select: { id: true },
    });

    return created;
  }

  /** List the current user's scans, newest first. Excludes detectionsJson. */
  async listMine(userId: string, take = 50, cursor?: string) {
    const items = await this.prisma.damageScan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(take, 1), 200),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: SUMMARY_SELECT,
    });
    const nextCursor = items.length === take ? items[items.length - 1].id : null;
    return { items, nextCursor };
  }

  /** Read one scan with its full detectionsJson — for the detail page. */
  async getOne(userId: string, scanId: string) {
    const scan = await this.prisma.damageScan.findUnique({ where: { id: scanId } });
    if (!scan) throw new NotFoundException('Scan not found');
    if (scan.userId !== userId) throw new ForbiddenException('Not your scan');
    return scan;
  }

  /** Delete a scan and its Cloudinary images. */
  async deleteOne(userId: string, scanId: string): Promise<{ deleted: true }> {
    const scan = await this.prisma.damageScan.findUnique({ where: { id: scanId } });
    if (!scan) throw new NotFoundException('Scan not found');
    if (scan.userId !== userId) throw new ForbiddenException('Not your scan');

    // Best-effort image cleanup. Don't fail the delete if Cloudinary
    // calls fail — the DB row is the source of truth.
    const detections = (scan.detectionsJson ?? []) as Array<{ imageUrl?: string | null }>;
    const publicIds = detections
      .map((e) => e.imageUrl)
      .filter((u): u is string => typeof u === 'string')
      .map((u) => this.extractPublicIdFromUrl(u))
      .filter((id): id is string => Boolean(id));

    await Promise.allSettled(
      publicIds.map((id) =>
        this.cloudinary.deleteImage(id).catch((e) => {
          this.logger.warn(`Failed to delete Cloudinary asset ${id}: ${e}`);
        }),
      ),
    );

    await this.prisma.damageScan.delete({ where: { id: scanId } });
    return { deleted: true };
  }

  // ── helpers ──

  private tallyDamageCounts(entries: Array<{ className: string }>): Record<DamageType, number> {
    const counts: Record<DamageType, number> = {
      dent: 0,
      scratch: 0,
      crack: 0,
      glass_shatter: 0,
      lamp_broken: 0,
      tire_flat: 0,
    };
    for (const e of entries) {
      if ((DAMAGE_TYPES as readonly string[]).includes(e.className)) {
        counts[e.className as DamageType] += 1;
      }
    }
    // Reference COUNT_COLUMNS so future schema-renames stay type-checked
    // even though we use the literal column names in the create() call
    // above for clarity.
    void COUNT_COLUMNS;
    return counts;
  }

  /**
   * Extract `<folder>/<file>` (the Cloudinary public_id) from a secure URL
   * like `https://res.cloudinary.com/<cloud>/image/upload/v1234/folder/file.jpg`.
   * Returns null if the URL doesn't match the expected shape.
   */
  private extractPublicIdFromUrl(url: string): string | null {
    const m = /\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/.exec(url);
    return m ? m[1] : null;
  }
}
