import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListServicesQueryKey,
  useCreateService,
  useDeleteService,
  useListServices,
  useUpdateService,
} from "@workspace/api-client-react";
import type { Service, ServiceInput } from "@workspace/api-client-react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { imageUrl } from "@/lib/imageUrl";

type ServiceDraft = { title: string; description: string; image: string; sortOrder: number };
const EMPTY_DRAFT: ServiceDraft = { title: "", description: "", image: "", sortOrder: 0 };

export default function AdminServices() {
  const queryClient = useQueryClient();
  const servicesQuery = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const [editing, setEditing] = useState<Service | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState("");
  const [reorderError, setReorderError] = useState("");
  const [notice, setNotice] = useState("");

  const services = useMemo(
    () => [...(servicesQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [servicesQuery.data],
  );
  const saving = createService.isPending || updateService.isPending;

  function beginCreate() {
    setEditing(null);
    setDraft({ ...EMPTY_DRAFT, sortOrder: services.length ? Math.max(...services.map((service) => service.sortOrder)) + 1 : 0 });
    setFormError("");
    setNotice("");
  }

  function beginEdit(service: Service) {
    setEditing(service);
    setDraft({ title: service.title, description: service.description, image: service.image, sortOrder: service.sortOrder });
    setFormError("");
    setNotice("");
  }

  function closeForm() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setFormError("");
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: ServiceInput = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      image: draft.image,
      sortOrder: editing ? editing.sortOrder : draft.sortOrder,
    };
    if (!input.title || !input.description || !input.image) {
      setFormError("Add a title, description, and image before saving.");
      return;
    }
    setFormError("");
    try {
      if (editing) await updateService.mutateAsync({ id: editing.id, data: input });
      else await createService.mutateAsync({ data: input });
      await queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
      setNotice(editing ? "Service updated." : "Service added.");
      closeForm();
    } catch {
      setFormError("We couldn't save this service. Check your connection and try again.");
    }
  }

  async function removeService(service: Service) {
    if (!window.confirm(`Delete “${service.title}”? This cannot be undone.`)) return;
    setNotice("");
    try {
      await deleteService.mutateAsync({ id: service.id });
      await queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
      setNotice(`${service.title} has been deleted.`);
    } catch {
      setNotice("The service could not be deleted. Please try again.");
    }
  }

  async function moveService(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= services.length) return;
    const reordered = [...services];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setReorderError("");
    try {
      for (const [sortOrder, service] of reordered.entries()) {
        if (service.sortOrder !== sortOrder) {
          await updateService.mutateAsync({
            id: service.id,
            data: { title: service.title, description: service.description, image: service.image, sortOrder },
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
    } catch {
      setReorderError("The new order could not be saved. The list has been refreshed.");
      await queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
    }
  }

  return (
    <div className="mx-auto max-w-6xl" data-testid="admin-services-page">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.32em] text-accent">Studio / Homepage</p>
          <h1 className="font-display text-4xl lg:text-5xl" data-testid="text-admin-services-title">What we do</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Shape the services visitors meet first. Reorder them here to change the story on the homepage.</p>
        </div>
        <button type="button" onClick={beginCreate} className="inline-flex items-center gap-2 bg-accent px-5 py-3 text-xs uppercase tracking-[0.16em] text-accent-foreground transition hover:bg-accent/90" data-testid="button-add-service"><Plus className="h-4 w-4" /> Add a service</button>
      </header>

      {notice && <p className="mb-5 border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground" role="status" data-testid="status-service-notice">{notice}</p>}

      {(editing || (draft !== EMPTY_DRAFT && !editing)) && (
        <section className="mb-9 border border-border bg-card p-5 sm:p-7" aria-labelledby="service-form-title" data-testid="panel-service-form">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-accent">{editing ? "Refine an entry" : "New entry"}</p>
              <h2 id="service-form-title" className="font-display text-3xl">{editing ? "Edit service" : "Add a service"}</h2>
            </div>
            <button type="button" onClick={closeForm} aria-label="Close service form" className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" data-testid="button-close-service-form"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={saveService} className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Service title</span>
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required maxLength={100} className="w-full border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-accent" placeholder="Weddings" data-testid="input-service-title" />
              </label>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Description</span>
                <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required rows={6} maxLength={1200} className="w-full resize-y border border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-accent" placeholder="Tell visitors what this experience feels like." data-testid="input-service-description" />
              </label>
              <p className="text-xs text-muted-foreground" data-testid="text-service-image-requirement">{draft.image ? "Image attached and ready to save." : "Choose an image to complete this service entry."}</p>
              {formError && <p className="text-sm text-destructive" role="alert" data-testid="error-service-form">{formError}</p>}
              {(createService.isError || updateService.isError) && !formError && <p className="text-sm text-destructive" role="alert" data-testid="error-service-mutation">The service could not be saved.</p>}
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-xs uppercase tracking-[0.16em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50" data-testid="button-save-service">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Create service"}</button>
                <button type="button" onClick={closeForm} className="border border-border px-5 py-3 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground" data-testid="button-cancel-service">Cancel</button>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Service image</p>
              <ImageUploader mode="single" value={draft.image || null} onChange={(image) => setDraft({ ...draft, image: image ?? "" })} label="Upload a landscape image" />
            </div>
          </form>
        </section>
      )}

      {servicesQuery.isLoading ? (
        <div className="space-y-3" data-testid="services-admin-loading">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse border border-border bg-card/60" />)}</div>
      ) : servicesQuery.isError ? (
        <div className="border border-border bg-card px-6 py-14 text-center" data-testid="services-admin-error">
          <p className="font-display text-2xl">The service list is unavailable.</p>
          <p className="mt-2 text-sm text-muted-foreground">Your entries are safe. Try loading them again.</p>
          <button type="button" onClick={() => servicesQuery.refetch()} className="mt-5 inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] hover:border-accent" data-testid="button-retry-admin-services"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
        </div>
      ) : services.length === 0 ? (
        <div className="relative overflow-hidden border border-dashed border-border bg-card/50 px-6 py-16 text-center sm:py-20" data-testid="services-admin-empty">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 text-accent"><ImagePlus className="h-6 w-6" /></div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-accent">A fresh page</p>
          <h2 className="font-display text-3xl sm:text-4xl">Your first service starts here.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Add a service with a photograph and a few thoughtful lines. It will appear on the homepage as soon as it is saved.</p>
          <button type="button" onClick={beginCreate} className="mt-7 inline-flex items-center gap-2 border border-accent px-5 py-3 text-xs uppercase tracking-[0.16em] text-accent hover:bg-accent hover:text-accent-foreground" data-testid="button-create-first-service"><Plus className="h-4 w-4" /> Create your first service</button>
        </div>
      ) : (
        <div className="space-y-3" data-testid="service-admin-list">
          {services.map((service, index) => (
            <article key={service.id} className="group grid gap-4 border border-border bg-card p-4 sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5" data-testid={`row-service-${service.id}`}>
              <div className="relative aspect-[5/3] overflow-hidden bg-muted sm:aspect-[4/3]">
                <img src={imageUrl(service.image)} alt="" className="h-full w-full object-cover" data-testid={`img-service-${service.id}`} />
                <span className="absolute left-2 top-2 bg-background/90 px-2 py-1 font-mono text-[10px] text-foreground" data-testid={`text-service-order-${service.id}`}>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-2xl" data-testid={`text-admin-service-title-${service.id}`}>{service.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground" data-testid={`text-admin-service-description-${service.id}`}>{service.description}</p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Added {new Date(service.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <div className="flex">
                  <button type="button" onClick={() => moveService(index, -1)} disabled={index === 0 || updateService.isPending} aria-label={`Move ${service.title} up`} className="border border-border p-2.5 text-muted-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30" data-testid={`button-move-service-up-${service.id}`}><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveService(index, 1)} disabled={index === services.length - 1 || updateService.isPending} aria-label={`Move ${service.title} down`} className="-ml-px border border-border p-2.5 text-muted-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30" data-testid={`button-move-service-down-${service.id}`}><ArrowDown className="h-4 w-4" /></button>
                </div>
                <button type="button" onClick={() => beginEdit(service)} className="inline-flex items-center gap-2 border border-border px-3 py-2.5 text-xs uppercase tracking-[0.12em] transition hover:border-accent hover:text-accent" data-testid={`button-edit-service-${service.id}`}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button type="button" onClick={() => removeService(service)} disabled={deleteService.isPending} aria-label={`Delete ${service.title}`} className="inline-flex items-center gap-2 border border-border px-3 py-2.5 text-xs uppercase tracking-[0.12em] text-destructive transition hover:border-destructive disabled:opacity-50" data-testid={`button-delete-service-${service.id}`}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {reorderError && <p className="mt-5 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert" data-testid="error-service-reorder">{reorderError}</p>}
      {updateService.isPending && <p className="mt-4 text-xs text-muted-foreground" role="status" data-testid="status-saving-order">Saving the new order…</p>}
    </div>
  );
}
