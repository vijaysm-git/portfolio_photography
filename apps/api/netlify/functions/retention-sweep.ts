import { getObjectStorageConfig } from "../../src/lib/objectStorage";
import { purgeExpiredRecords } from "../../src/lib/retentionPurger";

export const handler = async () => {
  const storage = getObjectStorageConfig();
  if (!storage.config) {
    throw new Error(
      `Cannot purge expired content because object storage is unavailable: ${storage.error}`,
    );
  }

  await purgeExpiredRecords();
  return { statusCode: 204, body: "" };
};
