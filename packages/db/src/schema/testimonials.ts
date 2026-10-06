import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const testimonialsTable = pgTable(
  "testimonials",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    photo: text("photo"),
    rating: integer("rating").notNull(),
    review: text("review").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("testimonials_deleted_at_idx").on(table.deletedAt)],
);

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type InsertTestimonial = typeof testimonialsTable.$inferInsert;
