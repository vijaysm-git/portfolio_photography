import { Router, type IRouter, type Request, type Response } from "express";
import { asc, eq } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";
import {
  CreateServiceBody,
  DeleteServiceParams,
  ListServicesResponse,
  UpdateServiceBody,
  UpdateServiceParams,
  UpdateServiceResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();

function serialize(row: typeof servicesTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/services", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(servicesTable)
    .orderBy(asc(servicesTable.sortOrder), asc(servicesTable.id));
  res.json(ListServicesResponse.parse(rows.map(serialize)));
});

router.post(
  "/services",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateServiceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid service content" });
      return;
    }

    const [row] = await db.insert(servicesTable).values(parsed.data).returning();
    res.status(201).json(serialize(row));
  },
);

router.put(
  "/services/:id",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const params = UpdateServiceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid service id" });
      return;
    }
    const parsed = UpdateServiceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid service content" });
      return;
    }

    const [row] = await db
      .update(servicesTable)
      .set(parsed.data)
      .where(eq(servicesTable.id, params.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    res.json(UpdateServiceResponse.parse(serialize(row)));
  },
);

router.delete(
  "/services/:id",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const params = DeleteServiceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid service id" });
      return;
    }
    const [row] = await db
      .delete(servicesTable)
      .where(eq(servicesTable.id, params.data.id))
      .returning({ id: servicesTable.id });
    if (!row) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
