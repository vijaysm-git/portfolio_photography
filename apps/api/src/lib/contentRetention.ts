const ARCHIVE_RETENTION_MS = 15 * 24 * 60 * 60 * 1000;

export function getArchiveRetentionCutoff(now = Date.now()): Date {
  return new Date(now - ARCHIVE_RETENTION_MS);
}

export function getArchiveExpiry(deletedAt: Date): Date {
  return new Date(deletedAt.getTime() + ARCHIVE_RETENTION_MS);
}
