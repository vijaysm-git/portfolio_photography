import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  and,
  arrayContains,
  asc,
  eq,
  isNotNull,
  lte,
  ne,
  or,
} from "drizzle-orm";
import {
  db,
  homepageSettingsTable,
  portfolioTable,
  servicesTable,
  testimonialsTable,
} from "@workspace/db";
import { logger } from "./logger";
import {
  getObjectStorageConfig,
  getOwnedMediaObjectKey,
} from "./objectStorage";
import { getArchiveRetentionCutoff } from "./contentRetention";

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const SWEEP_BATCH_SIZE = 100;

type ContentType = "portfolio" | "service" | "testimonial";
type StorageConfig = Extract<
  ReturnType<typeof getObjectStorageConfig>,
  { config: unknown }
>["config"];

async function mediaIsReferenced(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  publicUrl: string,
  ownerType: ContentType,
  ownerId: number,
): Promise<boolean> {
  const [portfolioReference] = await tx
    .select({ id: portfolioTable.id })
    .from(portfolioTable)
    .where(
      and(
        or(
          eq(portfolioTable.coverImage, publicUrl),
          arrayContains(portfolioTable.images, [publicUrl]),
        ),
        ne(portfolioTable.id, ownerType === "portfolio" ? ownerId : -1),
      ),
    )
    .limit(1);
  if (portfolioReference) return true;

  const [serviceReference] = await tx
    .select({ id: servicesTable.id })
    .from(servicesTable)
    .where(
      and(
        eq(servicesTable.image, publicUrl),
        ne(servicesTable.id, ownerType === "service" ? ownerId : -1),
      ),
    )
    .limit(1);
  if (serviceReference) return true;

  const [testimonialReference] = await tx
    .select({ id: testimonialsTable.id })
    .from(testimonialsTable)
    .where(
      and(
        eq(testimonialsTable.photo, publicUrl),
        ne(testimonialsTable.id, ownerType === "testimonial" ? ownerId : -1),
      ),
    )
    .limit(1);
  if (testimonialReference) return true;

  const [homepageReference] = await tx
    .select({ id: homepageSettingsTable.id })
    .from(homepageSettingsTable)
    .where(eq(homepageSettingsTable.heroImage, publicUrl))
    .limit(1);
  return Boolean(homepageReference);
}

async function deleteUnreferencedMedia(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  storage: StorageConfig,
  type: ContentType,
  id: number,
  urls: Array<string | null>,
): Promise<void> {
  const uniqueUrls = [
    ...new Set(urls.filter((url): url is string => Boolean(url))),
  ];
  for (const publicUrl of uniqueUrls) {
    const key = getOwnedMediaObjectKey(storage.publicBaseUrl, publicUrl);
    if (!key) continue;
    if (await mediaIsReferenced(tx, publicUrl, type, id)) continue;
    await storage.client.send(
      new DeleteObjectCommand({ Bucket: storage.bucket, Key: key }),
    );
  }
}

async function purgePortfolio(
  id: number,
  cutoff: Date,
  storage: StorageConfig,
) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(portfolioTable)
      .where(
        and(
          eq(portfolioTable.id, id),
          isNotNull(portfolioTable.deletedAt),
          lte(portfolioTable.deletedAt, cutoff),
        ),
      )
      .for("update", { skipLocked: true })
      .limit(1);
    if (!row) return;

    await deleteUnreferencedMedia(tx, storage, "portfolio", row.id, [
      row.coverImage,
      ...row.images,
    ]);
    await tx.delete(portfolioTable).where(eq(portfolioTable.id, row.id));
  });
}

async function purgeService(id: number, cutoff: Date, storage: StorageConfig) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(servicesTable)
      .where(
        and(
          eq(servicesTable.id, id),
          isNotNull(servicesTable.deletedAt),
          lte(servicesTable.deletedAt, cutoff),
        ),
      )
      .for("update", { skipLocked: true })
      .limit(1);
    if (!row) return;

    await deleteUnreferencedMedia(tx, storage, "service", row.id, [row.image]);
    await tx.delete(servicesTable).where(eq(servicesTable.id, row.id));
  });
}

async function purgeTestimonial(
  id: number,
  cutoff: Date,
  storage: StorageConfig,
) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(testimonialsTable)
      .where(
        and(
          eq(testimonialsTable.id, id),
          isNotNull(testimonialsTable.deletedAt),
          lte(testimonialsTable.deletedAt, cutoff),
        ),
      )
      .for("update", { skipLocked: true })
      .limit(1);
    if (!row) return;

    await deleteUnreferencedMedia(tx, storage, "testimonial", row.id, [
      row.photo,
    ]);
    await tx.delete(testimonialsTable).where(eq(testimonialsTable.id, row.id));
  });
}

export async function purgeExpiredRecords(): Promise<void> {
  const result = getObjectStorageConfig();
  if (!result.config) {
    logger.error(
      { error: result.error },
      "Cannot purge expired content because object storage is unavailable",
    );
    return;
  }

  const cutoff = getArchiveRetentionCutoff();
  const [portfolioIds, serviceIds, testimonialIds] = await Promise.all([
    db
      .select({ id: portfolioTable.id })
      .from(portfolioTable)
      .where(
        and(
          isNotNull(portfolioTable.deletedAt),
          lte(portfolioTable.deletedAt, cutoff),
        ),
      )
      .orderBy(asc(portfolioTable.deletedAt))
      .limit(SWEEP_BATCH_SIZE),
    db
      .select({ id: servicesTable.id })
      .from(servicesTable)
      .where(
        and(
          isNotNull(servicesTable.deletedAt),
          lte(servicesTable.deletedAt, cutoff),
        ),
      )
      .orderBy(asc(servicesTable.deletedAt))
      .limit(SWEEP_BATCH_SIZE),
    db
      .select({ id: testimonialsTable.id })
      .from(testimonialsTable)
      .where(
        and(
          isNotNull(testimonialsTable.deletedAt),
          lte(testimonialsTable.deletedAt, cutoff),
        ),
      )
      .orderBy(asc(testimonialsTable.deletedAt))
      .limit(SWEEP_BATCH_SIZE),
  ]);

  for (const { id } of portfolioIds) {
    try {
      await purgePortfolio(id, cutoff, result.config);
    } catch (error) {
      logger.error(
        { err: error, contentType: "portfolio", id },
        "Failed to permanently remove expired archived content",
      );
    }
  }
  for (const { id } of serviceIds) {
    try {
      await purgeService(id, cutoff, result.config);
    } catch (error) {
      logger.error(
        { err: error, contentType: "service", id },
        "Failed to permanently remove expired archived content",
      );
    }
  }
  for (const { id } of testimonialIds) {
    try {
      await purgeTestimonial(id, cutoff, result.config);
    } catch (error) {
      logger.error(
        { err: error, contentType: "testimonial", id },
        "Failed to permanently remove expired archived content",
      );
    }
  }
}

export function startRetentionPurger(): void {
  let running = false;
  const sweep = async () => {
    if (running) return;
    running = true;
    try {
      await purgeExpiredRecords();
    } catch (error) {
      logger.error({ err: error }, "Expired content purge sweep failed");
    } finally {
      running = false;
    }
  };

  void sweep();
  const timer = setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
  timer.unref();
}
