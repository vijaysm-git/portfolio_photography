import { useQueryClient } from "@tanstack/react-query";
import {
  useListContactSubmissions,
  useDeleteContactSubmission,
  getListContactSubmissionsQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Mail, Phone } from "lucide-react";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AdminInquiries() {
  const list = useListContactSubmissions({ query: { queryKey: getListContactSubmissionsQueryKey() } });
  const qc = useQueryClient();
  const del = useDeleteContactSubmission();
  const items = list.data ?? [];

  function handleDelete(id: number) {
    if (!window.confirm("Delete this inquiry?")) return;
    del.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListContactSubmissionsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        },
      },
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">Inbox</p>
        <h1 className="font-display text-4xl" data-testid="text-inquiries-title">Inquiries</h1>
        <p className="text-muted-foreground mt-2">Messages submitted through the contact form.</p>
      </div>

      {list.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-20 text-center" data-testid="empty-inquiries">
          <p className="text-muted-foreground">No inquiries yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="border border-border rounded-lg bg-card p-6" data-testid={`row-inquiry-${it.id}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h3 className="font-display text-xl" data-testid={`text-inquiry-name-${it.id}`}>{it.name}</h3>
                    <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30">
                      {it.eventType}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-5 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {it.phone}</span>
                    {it.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {it.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground" data-testid={`text-inquiry-date-${it.id}`}>{formatDate(it.createdAt)}</span>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(it.id)} disabled={del.isPending} data-testid={`button-delete-inquiry-${it.id}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mt-4 text-sm text-foreground/85 leading-relaxed whitespace-pre-line" data-testid={`text-inquiry-message-${it.id}`}>
                {it.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
