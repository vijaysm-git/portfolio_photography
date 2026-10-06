import { useRef, useState } from "react";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/imageUrl";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_STORED_BYTES = 2 * 1024 * 1024;
const IMAGE_DIMENSIONS: Record<
  UploadPurpose,
  { width: number; height: number }
> = {
  portfolio: { width: 2000, height: 2000 },
  services: { width: 1600, height: 1200 },
  testimonials: { width: 512, height: 512 },
  hero: { width: 2560, height: 1440 },
};
const ACCEPTED_TYPES = IMAGE_TYPES.join(",");

type ImageType = (typeof IMAGE_TYPES)[number];
type UploadPurpose = "portfolio" | "services" | "testimonials" | "hero";

type SingleProps = {
  mode: "single";
  purpose: UploadPurpose;
  value: string | null;
  onChange: (url: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  label?: string;
};

type MultipleProps = {
  mode: "multiple";
  purpose: UploadPurpose;
  value: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  label?: string;
};

const UPLOAD_GUIDANCE: Record<UploadPurpose, string> = {
  portfolio:
    "JPEG, PNG, WebP, AVIF · source up to 20 MB · auto-resized to 2000 px max and stored as WebP (max 2 MB)",
  services:
    "JPEG, PNG, WebP, AVIF · source up to 20 MB · auto-resized to 1600 × 1200 px max and stored as WebP (max 2 MB)",
  testimonials:
    "JPEG, PNG, WebP, AVIF · source up to 20 MB · auto-resized to 512 × 512 px max and stored as WebP (max 2 MB)",
  hero: "JPEG, PNG, WebP, AVIF · source up to 20 MB · auto-resized to 2560 × 1440 px max and stored as WebP (max 2 MB)",
};

function isImageType(value: string): value is ImageType {
  return IMAGE_TYPES.some((imageType) => imageType === value);
}

function formatFileSize(size: number): string {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

function formatStorageUsage(size: number): string {
  return `${(size / 1_000_000).toFixed(1)} MB`;
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not optimize this image."));
      },
      "image/webp",
      quality,
    );
  });
}

async function optimizeImage(
  file: File,
  purpose: UploadPurpose,
): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "This image could not be decoded. Try exporting it as JPEG, PNG, or WebP.",
    );
  }

  try {
    const limits = IMAGE_DIMENSIONS[purpose];
    const fit = Math.min(
      1,
      limits.width / bitmap.width,
      limits.height / bitmap.height,
    );
    let width = Math.max(1, Math.round(bitmap.width * fit));
    let height = Math.max(1, Math.round(bitmap.height * fit));
    const canvas = document.createElement("canvas");

    for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("The browser could not prepare this image for upload.");
      }
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.84, 0.76, 0.68, 0.6]) {
        const blob = await canvasBlob(canvas, quality);
        if (blob.type !== "image/webp") {
          throw new Error(
            "This browser cannot save optimized WebP images. Try an up-to-date browser.",
          );
        }
        if (blob.size <= MAX_STORED_BYTES) {
          const name = file.name.replace(/\.[^.]+$/, "") || "image";
          return new File([blob], `${name}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
        }
      }

      if (Math.min(width, height) <= 640) break;
      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }
  } finally {
    bitmap.close();
  }

  throw new Error(
    "This image is still larger than 2 MB after optimization. Choose a smaller image.",
  );
}

function uploadFile(
  uploadUrl: string,
  contentType: "image/webp",
  file: File,
  onProgress: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onerror = () =>
      reject(new Error("Could not connect to image storage."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Image storage rejected the upload (HTTP ${request.status}). Check the bucket CORS and permissions.`,
          ),
        );
      }
    };
    request.send(file);
  });
}

export function ImageUploader(props: SingleProps | MultipleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestUpload = useRequestUploadUrl();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const [unavailablePreviews, setUnavailablePreviews] = useState<Set<string>>(
    () => new Set(),
  );
  const [uploadingIndex, setUploadingIndex] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList).slice(
      0,
      props.mode === "single" ? 1 : undefined,
    );
    setUploadError("");
    setUploadNotice("");
    setIsUploading(true);
    props.onUploadingChange?.(true);

    const uploadedUrls = props.mode === "multiple" ? [...props.value] : [];
    try {
      for (const [index, file] of files.entries()) {
        setUploadingIndex(index + 1);
        setProgress(0);
        if (!isImageType(file.type)) {
          throw new Error("Choose a JPEG, PNG, WebP, or AVIF image.");
        }
        if (file.size < 1 || file.size > MAX_SOURCE_BYTES) {
          throw new Error("Images must be 20 MB or smaller.");
        }

        setIsOptimizing(true);
        const optimizedFile = await optimizeImage(file, props.purpose);
        setIsOptimizing(false);
        const signedUpload = await requestUpload.mutateAsync({
          data: {
            purpose: props.purpose,
            contentType: "image/webp",
            size: optimizedFile.size,
          },
        });
        await uploadFile(
          signedUpload.uploadUrl,
          "image/webp",
          optimizedFile,
          setProgress,
        );
        setUploadNotice(
          `Optimized ${formatFileSize(file.size)} to ${formatFileSize(optimizedFile.size)} WebP. Storage: ${formatStorageUsage(signedUpload.storageUsage.usedBytes)} / ${formatStorageUsage(signedUpload.storageUsage.uploadBudgetBytes)}.${signedUpload.storageUsage.warning ? " Warning threshold reached; review unused media." : ""}`,
        );

        if (props.mode === "single") {
          props.onChange(signedUpload.publicUrl);
        } else {
          uploadedUrls.push(signedUpload.publicUrl);
          props.onChange([...uploadedUrls]);
        }
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "The image could not be uploaded.",
      );
    } finally {
      setIsOptimizing(false);
      setIsUploading(false);
      props.onUploadingChange?.(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    if (props.mode === "single") {
      props.onChange(null);
      return;
    }
    props.onChange(
      props.value.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <div className="space-y-3">
      {props.label && (
        <p className="text-sm text-muted-foreground">{props.label}</p>
      )}
      <p
        className="text-xs text-muted-foreground"
        data-testid={`text-image-upload-guidance-${props.purpose}`}
      >
        {UPLOAD_GUIDANCE[props.purpose]}
      </p>

      {props.mode === "single" && props.value && (
        <div className="relative w-full max-w-xs aspect-[4/5] overflow-hidden rounded-md border border-border bg-muted">
          {unavailablePreviews.has(props.value) ? (
            <p className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
              Preview unavailable. Confirm the media bucket exists and allows
              public reads.
            </p>
          ) : (
            <img
              src={imageUrl(props.value)}
              alt=""
              onError={() =>
                setUnavailablePreviews((current) =>
                  new Set(current).add(imageUrl(props.value)),
                )
              }
              className="h-full w-full object-cover"
              data-testid="img-uploaded-cover"
            />
          )}
          <button
            type="button"
            onClick={() => removeAt(0)}
            disabled={isUploading}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full bg-background/90 p-2 text-foreground shadow"
            data-testid="button-remove-image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {props.mode === "multiple" && props.value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {props.value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {unavailablePreviews.has(url) ? (
                <span className="flex h-full items-center justify-center p-2 text-center text-[10px] text-muted-foreground">
                  Preview unavailable
                </span>
              ) : (
                <img
                  src={imageUrl(url)}
                  alt=""
                  onError={() =>
                    setUnavailablePreviews((current) =>
                      new Set(current).add(url),
                    )
                  }
                  className="h-full w-full object-cover"
                  data-testid={`img-gallery-${index}`}
                />
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={isUploading}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1.5 text-foreground shadow"
                data-testid={`button-remove-gallery-${index}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple={props.mode === "multiple"}
        disabled={isUploading}
        className="sr-only"
        onChange={(event) => void uploadFiles(event.currentTarget.files)}
        data-testid={`input-image-upload-${props.mode}`}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        data-testid={`button-image-upload-${props.mode}`}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
        {isUploading
          ? isOptimizing
            ? `Optimizing ${uploadingIndex}/${props.mode === "multiple" ? "images" : "image"}...`
            : `Uploading ${uploadingIndex}/${props.mode === "multiple" ? "images" : "image"} (${progress}%)`
          : props.mode === "multiple"
            ? "Add gallery images"
            : props.value
              ? "Replace image"
              : "Choose image"}
      </Button>
      {uploadError && (
        <p
          className="text-sm text-destructive"
          role="alert"
          data-testid="error-image-upload"
        >
          {uploadError}
        </p>
      )}
      {uploadNotice && !isUploading && (
        <p
          className={`text-sm ${uploadNotice.includes("Warning threshold reached") ? "text-amber-500" : "text-muted-foreground"}`}
          role="status"
        >
          {uploadNotice}
        </p>
      )}
    </div>
  );
}
