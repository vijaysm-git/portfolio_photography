import { useQueryClient } from "@tanstack/react-query";
import {
  getListPortfolioCategoriesQueryKey,
  getListPortfolioQueryKey,
  getListFeaturedPortfolioQueryKey,
  getListRecentlyDeletedContentQueryKey,
  getListServicesQueryKey,
  getListTestimonialsQueryKey,
  getGetAdminStatsQueryKey,
  useListRecentlyDeletedContent,
  useRestoreArchivedContent,
} from "@workspace/api-client-react";
import type { ArchivedContentItem } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/imageUrl";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;
const TYPE_LABELS: Record<ArchivedContentItem["type"], string> = {
  portfolio: "Project",
  service: "Service",
  testimonial: "Testimonial",
};

function invalidateContentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: getListRecentlyDeletedContentQueryKey(),
  });
  void queryClient.invalidateQueries({ queryKey: getListPortfolioQueryKey() });
  void queryClient.invalidateQueries({
    queryKey: getListFeaturedPortfolioQueryKey(),
  });
  void queryClient.invalidateQueries({
    queryKey: getListPortfolioCategoriesQueryKey(),
  });
  void queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
  void queryClient.invalidateQueries({
    queryKey: getListTestimonialsQueryKey(),
  });
  void queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
}

export default function AdminRecentlyDeleted() {
  const queryClient = useQueryClient();
  const list = useListRecentlyDeletedContent({
    query: { queryKey: getListRecentlyDeletedContentQueryKey() },
  });
  const restore = useRestoreArchivedContent();
  const [error, setError] = useState<string | null>(null);
  const items = list.data ?? [];

  function restoreItem(item: ArchivedContentItem) {
    setError(null);
    restore.mutate(
      { data: { type: item.type, id: item.id } },
      {
        onSuccess: () => invalidateContentQueries(queryClient),
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : "Could not restore this item.",
          );
        },
      },
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-border pb-6">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-accent">
            Recovery
          </p>
          <h1
            className="font-display text-4xl"
            data-testid="text-recently-deleted-title"
          >
            Recently deleted
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Deleted projects, services, and testimonials can be restored for 15
            days. After that, their records and app-owned uploaded images are
            permanently removed.
          </p>
        </header>

        {error && (
          <p className="mb-5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {list.isLoading ? (
          <p
            className="flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
          >
            <Loader2 className="h-4 w-4 animate-spin" /> Loading deleted
            items...
          </p>
        ) : list.isError ? (
          <p
            className="border border-destructive/40 p-5 text-sm text-destructive"
            role="alert"
          >
            Could not load deleted items. Refresh and try again.
          </p>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-border py-16 text-center">
            <Trash2 className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nothing is waiting to be restored.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const expiresAt = new Date(item.expiresAt);
              const daysLeft = Math.max(
                0,
                Math.ceil((expiresAt.getTime() - Date.now()) / DAY_MS),
              );
              return (
                <article
                  key={`${item.type}-${item.id}`}
                  className="flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-center"
                  data-testid={`row-deleted-${item.type}-${item.id}`}
                >
                  {item.image ? (
                    <img
                      src={imageUrl(item.image)}
                      alt=""
                      className="h-20 w-28 shrink-0 bg-muted object-cover"
                    />
                  ) : (
                    <div
                      className="h-20 w-28 shrink-0 bg-muted"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-accent">
                      {TYPE_LABELS[item.type]}
                    </p>
                    <h2 className="mt-1 truncate font-medium">{item.label}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Deleted {new Date(item.deletedAt).toLocaleString()} ·{" "}
                      {daysLeft === 0
                        ? "Expires today"
                        : `Permanently deleted in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => restoreItem(item)}
                    disabled={restore.isPending}
                    data-testid={`button-restore-${item.type}-${item.id}`}
                  >
                    {restore.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    Restore
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
