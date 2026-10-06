CREATE TABLE IF NOT EXISTS "admin_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_accounts_email_unique"
  ON "admin_accounts" USING btree ("email");
