import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const adminSecuritySettingsTable = pgTable(
  "admin_security_settings",
  {
    id: text("id").primaryKey(),
    sessionDurationHours: integer("session_duration_hours")
      .notNull()
      .default(12),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "admin_security_settings_session_duration_hours_check",
      sql`${table.sessionDurationHours} IN (12, 24)`,
    ),
  ],
);
