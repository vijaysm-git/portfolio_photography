import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";
import { CreateTestimonialBody } from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();

function serialize(row: typeof testimonialsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo,
    rating: row.rating,
    review: row.review,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/testimonials", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(testimonialsTable)
    .orderBy(desc(testimonialsTable.createdAt));
  res.json(rows.map(serialize));
});

router.post(
  "/testimonials",
  requireAdmin,
  async (req: Request, res: Response) => {
    const parsed = CreateTestimonialBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const { name, photo, rating, review } = parsed.data;
    const [row] = await db
      .insert(testimonialsTable)
      .values({ name, photo: photo ?? null, rating, review })
      .returning();
    res.status(201).json(serialize(row));
  },
);

router.delete(
  "/testimonials/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    res.sendStatus(204);
  },
);

export default router;
