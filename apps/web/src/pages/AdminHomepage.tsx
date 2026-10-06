import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetHomepageSettingsQueryKey,
  useGetHomepageSettings,
  useUpdateHomepageSettings,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ImageUploader } from "@/components/ImageUploader";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/imageUrl";
import { Loader2 } from "lucide-react";

export default function AdminHomepage() {
  const queryClient = useQueryClient();
  const settings = useGetHomepageSettings({
    query: { queryKey: getGetHomepageSettingsQueryKey() },
  });
  const updateSettings = useUpdateHomepageSettings();
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (settings.data) setHeroImage(settings.data.heroImage);
  }, [settings.data]);

  async function save() {
    setNotice("");
    try {
      const updated = await updateSettings.mutateAsync({
        data: { heroImage },
      });
      queryClient.setQueryData(getGetHomepageSettingsQueryKey(), updated);
      setNotice("Homepage hero image saved.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The homepage image could not be saved.",
      );
    }
  }

  const hasChanges = heroImage !== (settings.data?.heroImage ?? null);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl" data-testid="admin-homepage-page">
        <header className="mb-8 border-b border-border pb-6">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-accent">
            Manage
          </p>
          <h1 className="font-display text-4xl" data-testid="text-homepage-title">
            Homepage
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Choose the background image displayed behind the homepage hero.
            This image is independent of featured project covers.
          </p>
        </header>

        {settings.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading homepage settings...
          </div>
        ) : settings.isError ? (
          <p className="text-sm text-destructive" role="alert">
            Homepage settings could not be loaded. Refresh the page to try again.
          </p>
        ) : (
          <section className="space-y-6 border border-border bg-card p-6">
            <ImageUploader
              mode="single"
              purpose="hero"
              value={heroImage}
              onChange={setHeroImage}
              onUploadingChange={setIsUploading}
              label="Hero background image"
            />
            {heroImage && (
              <div className="overflow-hidden rounded-md border border-border">
                <img
                  src={imageUrl(heroImage)}
                  alt="Homepage hero background preview"
                  className="aspect-video w-full object-cover"
                  data-testid="img-homepage-hero-preview"
                />
              </div>
            )}
            {notice && (
              <p
                className={`text-sm ${notice.includes("saved") ? "text-accent" : "text-destructive"}`}
                role={notice.includes("saved") ? "status" : "alert"}
                data-testid="status-homepage-settings"
              >
                {notice}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void save()}
                disabled={!hasChanges || isUploading || updateSettings.isPending}
                data-testid="button-save-homepage"
              >
                {updateSettings.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save hero image
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHeroImage(null);
                  setNotice("");
                }}
                disabled={!heroImage || isUploading || updateSettings.isPending}
                data-testid="button-clear-homepage-hero"
              >
                Clear hero image
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Clearing and saving restores the first featured project cover as
              the hero background.
            </p>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
