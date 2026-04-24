import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, contactSubmissionsTable } from "@workspace/db";
import { CreateContactSubmissionBody } from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();

function serialize(row: typeof contactSubmissionsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    eventType: row.eventType,
    createdAt: row.createdAt.toISOString(),
  };
}

router.post("/contact", async (req: Request, res: Response) => {
  const parsed = CreateContactSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { name, phone, email, message, eventType } = parsed.data;
  const [row] = await db
    .insert(contactSubmissionsTable)
    .values({
      name,
      phone,
      email: email ?? null,
      message,
      eventType,
    })
    .returning();
  res.status(201).json(serialize(row));
});

router.get(
  "/contact",
  requireAdmin,
  async (_req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(contactSubmissionsTable)
      .orderBy(desc(contactSubmissionsTable.createdAt));
    res.json(rows.map(serialize));
  },
);

router.delete(
  "/contact/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db
      .delete(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, id));
    res.json({ ok: true });
  },
);

export default router;
