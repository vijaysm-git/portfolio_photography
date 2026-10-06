import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const homepageSettingsTable = pgTable("homepage_settings", {
  id: text("id").primaryKey(),
  heroImage: text("hero_image"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
