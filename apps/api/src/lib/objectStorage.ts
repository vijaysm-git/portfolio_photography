import { S3Client } from "@aws-sdk/client-s3";

export type ObjectStorageConfig = {
  client: S3Client;
  bucket: string;
  publicBaseUrl: URL;
};

export type ObjectStorageConfigResult =
  | { config: ObjectStorageConfig; error?: never }
  | { config?: never; error: string };

export function getObjectStorageConfig(): ObjectStorageConfigResult {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const region = process.env.S3_REGION?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.S3_SECRET_KEY?.trim();
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    const missing = [
      ["S3_ENDPOINT", endpoint],
      ["S3_REGION", region],
      ["S3_BUCKET", bucket],
      ["S3_ACCESS_KEY", accessKeyId],
      ["S3_SECRET_KEY", secretAccessKey],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);
    return { error: `Missing storage configuration: ${missing.join(", ")}` };
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return { error: "S3_ENDPOINT must be a valid URL." };
  }
  if (
    !["http:", "https:"].includes(endpointUrl.protocol) ||
    endpointUrl.username ||
    endpointUrl.password ||
    endpointUrl.search ||
    endpointUrl.hash
  ) {
    return {
      error:
        "S3_ENDPOINT must be an HTTP(S) URL without credentials, query, or fragment.",
    };
  }
  if (
    process.env.NODE_ENV === "production" &&
    endpointUrl.protocol !== "https:"
  ) {
    return { error: "S3_ENDPOINT must use HTTPS in production." };
  }

  const supabaseProjectHost = endpointUrl.hostname.match(
    /^([a-z0-9-]+)\.storage\.supabase\.co$/i,
  );
  const inferredSupabasePublicUrl =
    endpointUrl.pathname.replace(/\/+$/, "") === "/storage/v1/s3" &&
    supabaseProjectHost
      ? `${endpointUrl.protocol}//${supabaseProjectHost[1]}.supabase.co/storage/v1/object/public/${encodeURIComponent(bucket)}`
      : undefined;
  const publicUrl =
    process.env.S3_PUBLIC_BASE_URL?.trim() || inferredSupabasePublicUrl;
  if (!publicUrl) {
    return {
      error:
        "S3_PUBLIC_BASE_URL is required when the S3 endpoint is not a Supabase Storage S3 endpoint.",
    };
  }

  let publicBaseUrl: URL;
  try {
    publicBaseUrl = new URL(publicUrl);
  } catch {
    return { error: "S3_PUBLIC_BASE_URL must be a valid URL." };
  }
  if (
    !["http:", "https:"].includes(publicBaseUrl.protocol) ||
    (process.env.NODE_ENV === "production" &&
      publicBaseUrl.protocol !== "https:") ||
    publicBaseUrl.username ||
    publicBaseUrl.password ||
    publicBaseUrl.search ||
    publicBaseUrl.hash
  ) {
    return {
      error:
        "S3_PUBLIC_BASE_URL must be an HTTP(S) URL without credentials, query, or fragment.",
    };
  }

  const client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return { config: { client, bucket, publicBaseUrl } };
}

export function getPublicObjectUrl(baseUrl: URL, key: string): string {
  const base = new URL(`${baseUrl.toString().replace(/\/+$/, "")}/`);
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return new URL(encodedKey, base).toString();
}

export function getOwnedMediaObjectKey(
  baseUrl: URL,
  publicUrl: string,
): string | null {
  let objectUrl: URL;
  try {
    objectUrl = new URL(publicUrl);
  } catch {
    return null;
  }

  const basePath = `${baseUrl.pathname.replace(/\/+$/, "")}/`;
  if (
    objectUrl.origin !== baseUrl.origin ||
    !objectUrl.pathname.startsWith(basePath) ||
    objectUrl.search ||
    objectUrl.hash ||
    objectUrl.username ||
    objectUrl.password
  ) {
    return null;
  }

  const encodedSegments = objectUrl.pathname.slice(basePath.length).split("/");
  let segments: string[];
  try {
    segments = encodedSegments.map(decodeURIComponent);
  } catch {
    return null;
  }
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment.includes("/") ||
        segment === "." ||
        segment === "..",
    )
  ) {
    return null;
  }

  const key = segments.join("/");
  return /^media\/(portfolio|services|testimonials|hero)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/i.test(
    key,
  )
    ? key
    : null;
}
