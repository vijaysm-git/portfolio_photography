import { Router, type IRouter, type Request, type Response } from "express";
import { eq, isNull, sql } from "drizzle-orm";
import argon2 from "argon2";
import { rateLimit } from "express-rate-limit";
import {
  db,
  adminAccountsTable,
  adminSecuritySettingsTable,
  portfolioTable,
  testimonialsTable,
  contactSubmissionsTable,
} from "@workspace/db";
import {
  AdminLoginBody,
  ChangeAdminCredentialsBody,
  UpdateAdminSessionSettingsBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";
import { sessionLifetimeMs } from "../lib/sessionLifetime";

const router: IRouter = Router();

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again later." },
});

router.get(
  "/admin/session-settings",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const [settings] = await db
      .select({
        sessionDurationHours: adminSecuritySettingsTable.sessionDurationHours,
      })
      .from(adminSecuritySettingsTable)
      .where(eq(adminSecuritySettingsTable.id, "default"))
      .limit(1);
    if (!settings) {
      throw new Error(
        "Admin security settings are missing; apply database migrations.",
      );
    }
    res.json(settings);
  },
);

router.patch(
  "/admin/session-settings",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = UpdateAdminSessionSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid session duration" });
      return;
    }
    const [settings] = await db
      .update(adminSecuritySettingsTable)
      .set({
        sessionDurationHours: parsed.data.sessionDurationHours,
        updatedAt: new Date(),
      })
      .where(eq(adminSecuritySettingsTable.id, "default"))
      .returning({
        sessionDurationHours: adminSecuritySettingsTable.sessionDurationHours,
      });
    if (!settings) {
      throw new Error(
        "Admin security settings are missing; apply database migrations.",
      );
    }
    res.json(settings);
  },
);

router.post(
  "/admin/login",
  loginRateLimit,
  async (req: Request, res: Response) => {
    const parsed = AdminLoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const { password } = parsed.data;
    const [admin] = await db
      .select()
      .from(adminAccountsTable)
      .where(eq(adminAccountsTable.email, email))
      .limit(1);
    if (!admin || !(await argon2.verify(admin.passwordHash, password))) {
      req.log.warn("Rejected admin sign-in");
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const [sessionSettings] = await db
      .select({
        sessionDurationHours: adminSecuritySettingsTable.sessionDurationHours,
      })
      .from(adminSecuritySettingsTable)
      .where(eq(adminSecuritySettingsTable.id, "default"))
      .limit(1);
    if (!sessionSettings) {
      throw new Error(
        "Admin security settings are missing; apply database migrations.",
      );
    }

    req.session.regenerate((error) => {
      if (error) {
        req.log.error({ err: error }, "Failed to rotate admin session");
        res.status(500).json({ error: "Failed to sign in" });
        return;
      }
      req.session.isAdmin = true;
      req.session.adminAccountId = admin.id;
      req.session.adminEmail = admin.email;
      req.session.cookie.maxAge = sessionLifetimeMs(
        sessionSettings.sessionDurationHours,
      );
      res.json({ authenticated: true, email: admin.email });
    });
  },
);

router.patch(
  "/admin/credentials",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = ChangeAdminCredentialsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { currentPassword, email, newPassword } = parsed.data;
    if (!email && !newPassword) {
      res.status(400).json({ error: "Provide a new email or password" });
      return;
    }
    if (newPassword && newPassword.length < 12) {
      res
        .status(400)
        .json({ error: "New password must be at least 12 characters" });
      return;
    }

    const adminId = req.session.adminAccountId;
    if (!adminId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [admin] = await db
      .select()
      .from(adminAccountsTable)
      .where(eq(adminAccountsTable.id, adminId))
      .limit(1);
    if (!admin || !(await argon2.verify(admin.passwordHash, currentPassword))) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const updates: Partial<typeof adminAccountsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (email) updates.email = email.trim().toLowerCase();
    if (newPassword) {
      if (newPassword.length > 128) {
        res
          .status(400)
          .json({ error: "New password must be 128 characters or fewer" });
        return;
      }
      updates.passwordHash = await argon2.hash(newPassword, {
        type: argon2.argon2id,
      });
    }

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(adminAccountsTable)
          .set(updates)
          .where(eq(adminAccountsTable.id, adminId));
        await tx.execute(sql`DELETE FROM sessions`);
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        res.status(409).json({ error: "That email address is already in use" });
        return;
      }
      throw error;
    }

    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    res.json({ ok: true });
  },
);

router.post("/admin/logout", (req: Request, res: Response) => {
  req.session.destroy((error) => {
    if (error) {
      req.log.error({ err: error }, "Failed to destroy admin session");
      res.status(500).json({ error: "Failed to sign out" });
      return;
    }
    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    res.json({ ok: true });
  });
});

router.get("/admin/me", (req: Request, res: Response) => {
  if (req.session?.isAdmin && req.session.adminAccountId) {
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
      .from(portfolioTable)
      .where(isNull(portfolioTable.deletedAt));
    const [testimonialCountRow] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(testimonialsTable)
      .where(isNull(testimonialsTable.deletedAt));
    const [contactCountRow] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(contactSubmissionsTable);
    const categoryCounts = await db
      .select({
        category: portfolioTable.category,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(portfolioTable)
      .where(isNull(portfolioTable.deletedAt))
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
