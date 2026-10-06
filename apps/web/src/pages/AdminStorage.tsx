import { useGetStorageUsage } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Loader2, TriangleAlert } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default function AdminStorage() {
  const usage = useGetStorageUsage();
  const data = usage.data;
  const percentage = data
    ? Math.min(100, (data.usedBytes / data.uploadBudgetBytes) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-border pb-6">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-accent">
            Free-tier guardrails
          </p>
          <h1
            className="font-display text-4xl"
            data-testid="text-admin-storage-title"
          >
            Storage usage
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            New image uploads are blocked at the studio’s 700 MB storage budget
            to leave room below Supabase Free’s current 1 GB allowance.
          </p>
        </header>

        {usage.isLoading ? (
          <p
            className="flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
          >
            <Loader2 className="h-4 w-4 animate-spin" /> Measuring bucket
            usage...
          </p>
        ) : usage.isError ? (
          <div
            className="border border-destructive/40 bg-destructive/5 p-5 text-sm"
            role="alert"
          >
            <p className="font-medium text-destructive">
              Storage usage could not be verified.
            </p>
            <p className="mt-2 text-muted-foreground">
              Uploads are blocked until the API can read Supabase Storage
              metadata. Check that the API database role can read
              <code className="mx-1">storage.objects</code> and that migrations
              have been applied.
            </p>
          </div>
        ) : data ? (
          <section className="space-y-5 border border-border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p
                className="font-display text-3xl"
                data-testid="text-storage-usage"
              >
                {formatBytes(data.usedBytes)}
                <span className="ml-2 text-base text-muted-foreground">
                  of {formatBytes(data.uploadBudgetBytes)} app budget
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {percentage.toFixed(1)}% of app budget
              </p>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Storage budget used"
              aria-valuenow={Math.round(percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full transition-all ${data.warning ? "bg-amber-500" : "bg-accent"}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {data.warning && (
              <p
                className="flex items-start gap-2 text-sm text-amber-500"
                role="status"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Storage has reached the 500 MB warning threshold. Review unused
                and replaced images before adding more content.
              </p>
            )}
            <dl className="grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Warning threshold</dt>
                <dd className="mt-1 font-medium">
                  {formatBytes(data.warningThresholdBytes)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Hard upload stop</dt>
                <dd className="mt-1 font-medium">
                  {formatBytes(data.uploadBudgetBytes)}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section className="mt-6 space-y-3 border border-border p-6 text-sm">
          <h2 className="font-medium">Traffic and database are separate</h2>
          <p className="text-muted-foreground">
            This page measures stored object bytes and active upload
            reservations. It cannot measure public image downloads: those are
            served directly from Supabase Storage. Check Supabase Dashboard
            usage for egress and cached egress; visitor traffic can exceed the
            Free monthly allowance even when stored media stays below budget.
          </p>
          <p className="text-muted-foreground">
            The database contains image URLs and content text, not the image
            files. Check the Supabase database usage separately. Free quotas can
            change, and Supabase may pause Free projects after inactivity.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
