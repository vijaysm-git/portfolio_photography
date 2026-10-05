import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, portfolioTable } from "@workspace/db";
import {
  ListPortfolioQueryParams,
  CreatePortfolioItemBody,
  UpdatePortfolioItemBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();

function serialize(row: typeof portfolioTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    coverImage: row.coverImage,
    images: row.images ?? [],
    description: row.description ?? "",
    featured: row.featured,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/portfolio", async (req: Request, res: Response) => {
  const parsed = ListPortfolioQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { category } = parsed.data;
  const rows = category
    ? await db
        .select()
        .from(portfolioTable)
        .where(eq(portfolioTable.category, category))
        .orderBy(desc(portfolioTable.createdAt))
    : await db
        .select()
        .from(portfolioTable)
        .orderBy(desc(portfolioTable.createdAt));
  res.json(rows.map(serialize));
});

router.get("/portfolio/featured", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(portfolioTable)
    .where(eq(portfolioTable.featured, true))
    .orderBy(desc(portfolioTable.createdAt))
    .limit(6);
  res.json(rows.map(serialize));
});

router.get("/portfolio/categories", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      category: portfolioTable.category,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(portfolioTable)
    .groupBy(portfolioTable.category);
  res.json(rows);
});

router.get("/portfolio/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(portfolioTable)
    .where(eq(portfolioTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.post("/portfolio", requireAdmin, async (req: Request, res: Response) => {
  const parsed = CreatePortfolioItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { title, category, coverImage, images, description, featured } =
    parsed.data;
  const [row] = await db
    .insert(portfolioTable)
    .values({
      title,
      category,
      coverImage,
      images: images ?? [],
      description: description ?? "",
      featured: featured ?? false,
    })
    .returning();
  res.status(201).json(serialize(row));
});

router.patch(
  "/portfolio/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdatePortfolioItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const { title, category, coverImage, images, description, featured } =
      parsed.data;
    const [row] = await db
      .update(portfolioTable)
      .set({
        title,
        category,
        coverImage,
        images: images ?? [],
        description: description ?? "",
        featured: featured ?? false,
      })
      .where(eq(portfolioTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(serialize(row));
  },
);

router.delete(
  "/portfolio/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(portfolioTable).where(eq(portfolioTable.id, id));
    res.sendStatus(204);
  },
);

export default router;
