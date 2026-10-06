import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, gt, inArray, isNotNull, isNull } from "drizzle-orm";
import {
  db,
  portfolioTable,
  servicesTable,
  testimonialsTable,
} from "@workspace/db";
import {
  BulkArchiveContentBody,
  RestoreArchivedContentBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  getArchiveExpiry,
  getArchiveRetentionCutoff,
} from "../lib/contentRetention";

const router: IRouter = Router();

router.get(
  "/admin/recently-deleted",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const cutoff = getArchiveRetentionCutoff();
    const [portfolioItems, services, testimonials] = await Promise.all([
      db
        .select({
          id: portfolioTable.id,
          label: portfolioTable.title,
          image: portfolioTable.coverImage,
          deletedAt: portfolioTable.deletedAt,
        })
        .from(portfolioTable)
        .where(
          and(
            isNotNull(portfolioTable.deletedAt),
            gt(portfolioTable.deletedAt, cutoff),
          ),
        ),
      db
        .select({
          id: servicesTable.id,
          label: servicesTable.title,
          image: servicesTable.image,
          deletedAt: servicesTable.deletedAt,
        })
        .from(servicesTable)
        .where(
          and(
            isNotNull(servicesTable.deletedAt),
            gt(servicesTable.deletedAt, cutoff),
          ),
        ),
      db
        .select({
          id: testimonialsTable.id,
          label: testimonialsTable.name,
          image: testimonialsTable.photo,
          deletedAt: testimonialsTable.deletedAt,
        })
        .from(testimonialsTable)
        .where(
          and(
            isNotNull(testimonialsTable.deletedAt),
            gt(testimonialsTable.deletedAt, cutoff),
          ),
        ),
    ]);

    const items = [
      ...portfolioItems.flatMap((item) =>
        item.deletedAt
          ? [
              {
                type: "portfolio" as const,
                id: item.id,
                label: item.label,
                image: item.image,
                deletedAt: item.deletedAt.toISOString(),
                expiresAt: getArchiveExpiry(item.deletedAt).toISOString(),
              },
            ]
          : [],
      ),
      ...services.flatMap((item) =>
        item.deletedAt
          ? [
              {
                type: "service" as const,
                id: item.id,
                label: item.label,
                image: item.image,
                deletedAt: item.deletedAt.toISOString(),
                expiresAt: getArchiveExpiry(item.deletedAt).toISOString(),
              },
            ]
          : [],
      ),
      ...testimonials.flatMap((item) =>
        item.deletedAt
          ? [
              {
                type: "testimonial" as const,
                id: item.id,
                label: item.label,
                image: item.image,
                deletedAt: item.deletedAt.toISOString(),
                expiresAt: getArchiveExpiry(item.deletedAt).toISOString(),
              },
            ]
          : [],
      ),
    ].sort(
      (a, b) =>
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
    );

    res.json(items);
  },
);

router.post(
  "/admin/recently-deleted/restore",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = RestoreArchivedContentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid record type or ID" });
      return;
    }

    const { id, type } = parsed.data;
    const retentionCutoff = getArchiveRetentionCutoff();
    let restored = false;

    if (type === "portfolio") {
      const [row] = await db
        .update(portfolioTable)
        .set({ deletedAt: null })
        .where(
          and(
            eq(portfolioTable.id, id),
            isNotNull(portfolioTable.deletedAt),
            gt(portfolioTable.deletedAt, retentionCutoff),
          ),
        )
        .returning({ id: portfolioTable.id });
      restored = Boolean(row);
    } else if (type === "service") {
      const [row] = await db
        .update(servicesTable)
        .set({ deletedAt: null })
        .where(
          and(
            eq(servicesTable.id, id),
            isNotNull(servicesTable.deletedAt),
            gt(servicesTable.deletedAt, retentionCutoff),
          ),
        )
        .returning({ id: servicesTable.id });
      restored = Boolean(row);
    } else {
      const [row] = await db
        .update(testimonialsTable)
        .set({ deletedAt: null })
        .where(
          and(
            eq(testimonialsTable.id, id),
            isNotNull(testimonialsTable.deletedAt),
            gt(testimonialsTable.deletedAt, retentionCutoff),
          ),
        )
        .returning({ id: testimonialsTable.id });
      restored = Boolean(row);
    }

    if (!restored) {
      res
        .status(404)
        .json({ error: "Record not found or recovery period ended" });
      return;
    }
    res.json({ ok: true });
  },
);

router.post(
  "/admin/recently-deleted/bulk-archive",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = BulkArchiveContentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid record type or IDs" });
      return;
    }
    if (new Set(parsed.data.ids).size !== parsed.data.ids.length) {
      res.status(400).json({ error: "Record IDs must be unique" });
      return;
    }

    const deletedAt = new Date();
    const { ids, type } = parsed.data;
    let archivedCount = 0;
    if (type === "portfolio") {
      const rows = await db
        .update(portfolioTable)
        .set({ deletedAt })
        .where(
          and(
            inArray(portfolioTable.id, ids),
            isNull(portfolioTable.deletedAt),
          ),
        )
        .returning({ id: portfolioTable.id });
      archivedCount = rows.length;
    } else if (type === "service") {
      const rows = await db
        .update(servicesTable)
        .set({ deletedAt })
        .where(
          and(inArray(servicesTable.id, ids), isNull(servicesTable.deletedAt)),
        )
        .returning({ id: servicesTable.id });
      archivedCount = rows.length;
    } else {
      const rows = await db
        .update(testimonialsTable)
        .set({ deletedAt })
        .where(
          and(
            inArray(testimonialsTable.id, ids),
            isNull(testimonialsTable.deletedAt),
          ),
        )
        .returning({ id: testimonialsTable.id });
      archivedCount = rows.length;
    }

    res.json({ archivedCount });
  },
);

export default router;
