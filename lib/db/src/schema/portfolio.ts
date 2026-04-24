import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const portfolioTable = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  coverImage: text("cover_image").notNull(),
  images: text("images").array().notNull().default([]),
  description: text("description").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PortfolioItem = typeof portfolioTable.$inferSelect;
export type InsertPortfolioItem = typeof portfolioTable.$inferInsert;
