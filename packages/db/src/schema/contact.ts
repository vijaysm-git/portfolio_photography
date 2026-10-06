import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message").notNull(),
  eventType: text("event_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissionsTable.$inferInsert;
