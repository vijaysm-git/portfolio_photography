import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const storageUploadReservationsTable = pgTable(
  "storage_upload_reservations",
  {
    objectKey: text("object_key").primaryKey(),
    bucketId: text("bucket_id").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("storage_upload_reservations_expires_at_idx").on(table.expiresAt),
  ],
);
