CREATE TABLE IF NOT EXISTS "homepage_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "hero_image" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "homepage_settings" ("id", "hero_image")
VALUES ('default', NULL)
ON CONFLICT ("id") DO NOTHING;
