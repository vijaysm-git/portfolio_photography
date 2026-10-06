import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const portfolioTable = pgTable(
  "portfolio",
  {
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
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("portfolio_deleted_at_idx").on(table.deletedAt)],
);

export type PortfolioItem = typeof portfolioTable.$inferSelect;
export type InsertPortfolioItem = typeof portfolioTable.$inferInsert;
