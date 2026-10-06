import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  getObjectStorageConfig,
  getPublicObjectUrl,
} from "../lib/objectStorage";
import {
  getStorageUsage,
  reserveUploadSpace,
  UPLOAD_URL_TTL_SECONDS,
} from "../lib/storageUsage";
import { RequestUploadUrlBody } from "@workspace/api-zod";

const router: IRouter = Router();
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const imageExtensions = {
  "image/webp": "webp",
} as const;

router.get(
  "/storage/usage",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const storage = getObjectStorageConfig();
    if (!storage.config) {
      req.log.error(
        { error: storage.error },
        "Cannot measure storage usage because object storage is not configured",
      );
      res.status(503).json({
        error:
          "Storage usage is unavailable because image storage is not configured.",
      });
      return;
    }

    try {
      res.json(await getStorageUsage(storage.config.bucket));
    } catch (error) {
      req.log.error({ err: error }, "Could not measure Supabase Storage usage");
      res.status(503).json({
        error:
          "Could not verify Storage usage. Uploads will remain blocked until it can be measured.",
      });
    }
  },
);

router.post(
  "/storage/uploads/request-url",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid image upload request" });
      return;
    }
    const { contentType, purpose, size } = parsed.data;
    if (
      contentType !== "image/webp" ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > MAX_UPLOAD_BYTES
    ) {
      res.status(400).json({
        error: "Optimized images must be WebP files up to 2 MB.",
      });
      return;
    }

    const storage = getObjectStorageConfig();
    if (!storage.config) {
      req.log.error(
        { error: storage.error },
        "Object storage is not configured",
      );
      res.status(503).json({ error: "Image storage is not configured." });
      return;
    }

    const { client, bucket, publicBaseUrl } = storage.config;
    const extension = imageExtensions["image/webp"];
    const key = `media/${purpose}/${randomUUID()}.${extension}`;
    try {
      const uploadUrl = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
          ContentLength: size,
        }),
        {
          expiresIn: UPLOAD_URL_TTL_SECONDS,
          signableHeaders: new Set(["content-type"]),
        },
      );
      const usage = await reserveUploadSpace(bucket, key, size);
      if (!usage) {
        res.status(507).json({
          error:
            "The studio's 700 MB image-storage budget has been reached. Remove unused media or wait before uploading more.",
        });
        return;
      }
      res.json({
        uploadUrl,
        contentType,
        publicUrl: getPublicObjectUrl(publicBaseUrl, key),
        storageUsage: usage,
      });
    } catch (error) {
      req.log.error({ err: error }, "Could not safely prepare an image upload");
      res.status(503).json({
        error:
          "Could not verify storage capacity. The upload was not authorized; retry after checking database Storage metadata.",
      });
    }
  },
);

export default router;
