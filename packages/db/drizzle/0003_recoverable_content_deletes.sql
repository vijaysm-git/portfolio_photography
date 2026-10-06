ALTER TABLE "portfolio" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolio_deleted_at_idx" ON "portfolio" ("deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_deleted_at_idx" ON "services" ("deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "testimonials_deleted_at_idx" ON "testimonials" ("deleted_at");
