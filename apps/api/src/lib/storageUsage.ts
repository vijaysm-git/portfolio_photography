import { pool } from "@workspace/db";

type PoolConnectCallback = Parameters<typeof pool.connect>[0];
type PoolClient = NonNullable<Parameters<PoolConnectCallback>[1]>;

function connectClient(): Promise<PoolClient> {
  return new Promise((resolve, reject) => {
    pool.connect((error, client) => {
      if (error) reject(error);
      else if (client) resolve(client);
      else reject(new Error("PostgreSQL returned no storage usage client."));
    });
  });
}

export const STORAGE_WARNING_BYTES = 500_000_000;
export const STORAGE_UPLOAD_BUDGET_BYTES = 700_000_000;
export const UPLOAD_URL_TTL_SECONDS = 300;
const UPLOAD_RESERVATION_TTL_SECONDS = UPLOAD_URL_TTL_SECONDS + 60;
const STORAGE_ADMISSION_LOCK_ID = 7_351_601_041_221;

export type StorageUsage = {
  usedBytes: number;
  warningThresholdBytes: number;
  uploadBudgetBytes: number;
  warning: boolean;
};

type StorageUsageRow = {
  object_bytes: string;
  invalid_object_count: number;
  reserved_bytes: string;
};

function toUsage(row: StorageUsageRow): StorageUsage {
  if (row.invalid_object_count > 0) {
    throw new Error(
      "Storage usage cannot be measured because some bucket objects have no valid size metadata.",
    );
  }
  const usedBytes = Number(row.object_bytes) + Number(row.reserved_bytes);
  if (!Number.isSafeInteger(usedBytes) || usedBytes < 0) {
    throw new Error(
      "Storage usage measurement returned an invalid byte count.",
    );
  }
  return {
    usedBytes,
    warningThresholdBytes: STORAGE_WARNING_BYTES,
    uploadBudgetBytes: STORAGE_UPLOAD_BUDGET_BYTES,
    warning: usedBytes >= STORAGE_WARNING_BYTES,
  };
}

async function queryStorageUsage(
  client: PoolClient,
  bucketId: string,
): Promise<StorageUsage> {
  const result = await client.query<StorageUsageRow>(
    `SELECT
       COALESCE(
         SUM(
           CASE
             WHEN COALESCE(metadata ->> 'size', '') ~ '^[0-9]+$'
               THEN (metadata ->> 'size')::bigint
             ELSE 0
           END
         ),
         0
       )::text AS object_bytes,
       COUNT(*) FILTER (
         WHERE COALESCE(metadata ->> 'size', '') !~ '^[0-9]+$'
       )::int AS invalid_object_count,
       COALESCE((
         SELECT SUM(reservation.size_bytes)
         FROM public.storage_upload_reservations AS reservation
         WHERE reservation.bucket_id = $1
           AND reservation.expires_at > NOW()
           AND NOT EXISTS (
             SELECT 1
             FROM storage.objects AS uploaded
             WHERE uploaded.bucket_id = reservation.bucket_id
               AND uploaded.name = reservation.object_key
           )
       ), 0)::text AS reserved_bytes
     FROM storage.objects
     WHERE bucket_id = $1`,
    [bucketId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Storage usage query returned no result.");
  }
  return toUsage(row);
}

export async function getStorageUsage(bucketId: string): Promise<StorageUsage> {
  const client = await connectClient();
  try {
    return await queryStorageUsage(client, bucketId);
  } finally {
    client.release();
  }
}

export async function reserveUploadSpace(
  bucketId: string,
  objectKey: string,
  sizeBytes: number,
): Promise<StorageUsage | null> {
  const client = await connectClient();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [
      STORAGE_ADMISSION_LOCK_ID,
    ]);
    await client.query(
      "DELETE FROM public.storage_upload_reservations WHERE expires_at <= NOW()",
    );
    const usage = await queryStorageUsage(client, bucketId);
    if (usage.usedBytes + sizeBytes >= STORAGE_UPLOAD_BUDGET_BYTES) {
      await client.query("COMMIT");
      transactionOpen = false;
      return null;
    }

    await client.query(
      `INSERT INTO public.storage_upload_reservations
         (object_key, bucket_id, size_bytes, expires_at)
       VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 second'))`,
      [objectKey, bucketId, sizeBytes, UPLOAD_RESERVATION_TTL_SECONDS],
    );
    await client.query("COMMIT");
    transactionOpen = false;
    return {
      usedBytes: usage.usedBytes + sizeBytes,
      warningThresholdBytes: usage.warningThresholdBytes,
      uploadBudgetBytes: usage.uploadBudgetBytes,
      warning: usage.usedBytes + sizeBytes >= STORAGE_WARNING_BYTES,
    };
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          "Failed to reserve storage and roll back the transaction.",
        );
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
