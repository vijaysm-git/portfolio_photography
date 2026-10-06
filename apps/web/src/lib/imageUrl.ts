export function imageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      const supabaseStorageHost = url.hostname.match(
        /^([a-z0-9-]+)\.storage\.supabase\.co$/i,
      );
      if (
        supabaseStorageHost &&
        url.pathname.startsWith("/storage/v1/object/public/")
      ) {
        url.hostname = `${supabaseStorageHost[1]}.supabase.co`;
        return url.toString();
      }
    } catch {
      return "";
    }
    return path;
  }
  if (path.startsWith("/objects/") || path.startsWith("/public-objects/")) {
    return "";
  }
  return path;
}
