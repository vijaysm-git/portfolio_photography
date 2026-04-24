const STORAGE_PREFIX = "/api/storage";

export function imageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/objects/") || path.startsWith("/public-objects/")) {
    return `${STORAGE_PREFIX}${path}`;
  }
  return path;
}
