import { useRef, useState } from "react";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { imageUrl } from "@/lib/imageUrl";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
type SupportedImageContentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif";
const SUPPORTED_IMAGE_TYPES = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function isSupportedImageType(type: string): type is SupportedImageContentType {
  return SUPPORTED_IMAGE_TYPES.has(type);
}

type SingleProps = {
  mode: "single";
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
};

type MultipleProps = {
  mode: "multiple";
  value: string[];
  onChange: (paths: string[]) => void;
  label?: string;
};

export function ImageUploader(props: SingleProps | MultipleProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const requestUrl = useRequestUploadUrl();

  async function uploadOne(file: File): Promise<string> {
    if (!isSupportedImageType(file.type)) {
      throw new Error("Choose a JPEG, PNG, WebP, or AVIF image.");
    }
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      throw new Error("Images must be smaller than 15 MB.");
    }
    const result = await requestUrl.mutateAsync({
      data: { name: file.name, size: file.size, contentType: file.type },
    });
    const putRes = await fetch(result.uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed (${putRes.status})`);
    }
    return result.objectPath;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      if (props.mode === "single") {
        setProgress("Uploading...");
        const path = await uploadOne(files[0]);
        props.onChange(path);
      } else {
        const arr = Array.from(files);
        const uploaded: string[] = [];
        for (let i = 0; i < arr.length; i++) {
          setProgress(`Uploading ${i + 1} of ${arr.length}...`);
          uploaded.push(await uploadOne(arr[i]));
        }
        props.onChange([...props.value, ...uploaded]);
      }
    } catch (err) {
      console.error("Upload error", err);
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx: number) {
    if (props.mode !== "multiple") return;
    props.onChange(props.value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {props.label && <p className="text-sm text-muted-foreground">{props.label}</p>}

      {props.mode === "single" && props.value && (
        <div className="relative w-full max-w-xs aspect-[4/5] rounded-md overflow-hidden border border-border bg-muted">
          <img src={imageUrl(props.value)} alt="" className="w-full h-full object-cover" data-testid="img-uploaded-cover" />
          <button
            type="button"
            onClick={() => props.onChange(null)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur hover:bg-background transition"
            data-testid="button-remove-cover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {props.mode === "multiple" && props.value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {props.value.map((path, i) => (
            <div key={`${path}-${i}`} className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted group">
              <img src={imageUrl(path)} alt="" className="w-full h-full object-cover" data-testid={`img-gallery-${i}`} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition"
                data-testid={`button-remove-gallery-${i}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-3 border border-dashed border-border rounded-md px-4 py-6 bg-muted/30 hover:bg-muted/50 transition cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        data-testid={`uploader-drop-${props.mode}`}
      >
        <div className="p-2 rounded-md bg-background">
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {busy ? progress : props.mode === "single" ? "Upload cover image" : "Add images to gallery"}
          </p>
          <p className="text-xs text-muted-foreground">Drop a file or click to browse</p>
        </div>
        {!busy && (
          <Button type="button" variant="outline" size="sm" data-testid={`button-browse-${props.mode}`}>
            <ImageIcon className="h-4 w-4 mr-1.5" />
            Browse
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
        multiple={props.mode === "multiple"}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        data-testid={`input-file-${props.mode}`}
      />
    </div>
  );
}
