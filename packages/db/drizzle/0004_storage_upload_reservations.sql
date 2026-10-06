CREATE TABLE IF NOT EXISTS "storage_upload_reservations" (
  "object_key" text PRIMARY KEY NOT NULL,
  "bucket_id" text NOT NULL,
  "size_bytes" bigint NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storage_upload_reservations_expires_at_idx"
  ON "storage_upload_reservations" ("expires_at");
