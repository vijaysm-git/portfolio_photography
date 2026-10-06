CREATE TABLE IF NOT EXISTS "admin_security_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "session_duration_hours" integer DEFAULT 12 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "admin_security_settings_session_duration_hours_check"
    CHECK ("session_duration_hours" IN (12, 24))
);
--> statement-breakpoint
INSERT INTO "admin_security_settings" ("id", "session_duration_hours")
VALUES ('default', 12)
ON CONFLICT ("id") DO NOTHING;
