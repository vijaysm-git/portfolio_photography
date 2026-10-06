import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, homepageSettingsTable } from "@workspace/db";
import {
  UpdateHomepageSettingsBody,
  UpdateHomepageSettingsResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();
const SETTINGS_ID = "default";

async function getSettings() {
  const [settings] = await db
    .select()
    .from(homepageSettingsTable)
    .where(eq(homepageSettingsTable.id, SETTINGS_ID))
    .limit(1);
  return settings ?? { heroImage: null };
}

router.get(
  "/homepage/settings",
  async (_req: Request, res: Response): Promise<void> => {
    const settings = await getSettings();
    res.json({ heroImage: settings.heroImage });
  },
);

router.patch(
  "/homepage/settings",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = UpdateHomepageSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid homepage settings" });
      return;
    }

    const [settings] = await db
      .insert(homepageSettingsTable)
      .values({
        id: SETTINGS_ID,
        heroImage: parsed.data.heroImage,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: homepageSettingsTable.id,
        set: {
          heroImage: parsed.data.heroImage,
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json(UpdateHomepageSettingsResponse.parse({ heroImage: settings.heroImage }));
  },
);

export default router;
