import { Router, type IRouter, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import {
  db,
  portfolioTable,
  testimonialsTable,
  contactSubmissionsTable,
} from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();

router.post("/admin/login", async (req: Request, res: Response) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    res.status(500).json({ error: "Admin credentials not configured" });
    return;
  }
  if (email !== adminEmail || password !== adminPassword) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  req.session.isAdmin = true;
  req.session.adminEmail = email;
  res.json({ authenticated: true, email });
});

router.post("/admin/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/admin/me", (req: Request, res: Response) => {
  if (req.session?.isAdmin) {
    res.json({
      authenticated: true,
      email: req.session.adminEmail ?? null,
    });
    return;
  }
  res.json({ authenticated: false, email: null });
});

router.get(
  "/admin/stats",
  requireAdmin,
  async (_req: Request, res: Response) => {
    const [portfolioCountRow] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(portfolioTable);
    const [testimonialCountRow] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(testimonialsTable);
    const [contactCountRow] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(contactSubmissionsTable);
    const categoryCounts = await db
      .select({
        category: portfolioTable.category,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(portfolioTable)
      .groupBy(portfolioTable.category);
    res.json({
      portfolioCount: portfolioCountRow?.count ?? 0,
      testimonialCount: testimonialCountRow?.count ?? 0,
      contactCount: contactCountRow?.count ?? 0,
      categoryCounts,
    });
  },
);

export default router;
