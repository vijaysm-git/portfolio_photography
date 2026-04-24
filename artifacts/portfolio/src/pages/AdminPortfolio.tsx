import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPortfolio,
  useCreatePortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
  getListPortfolioQueryKey,
  getListFeaturedPortfolioQueryKey,
  getListPortfolioCategoriesQueryKey,
  getGetAdminStatsQueryKey,
  type PortfolioItem,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/ImageUploader";
import { imageUrl } from "@/lib/imageUrl";
import { Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Required"),
  category: z.enum(["wedding", "events", "portrait", "studio"]),
  coverImage: z.string().min(1, "Cover image is required"),
  images: z.array(z.string()).default([]),
  description: z.string().default(""),
  featured: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULTS: FormValues = {
  title: "",
  category: "wedding",
  coverImage: "",
  images: [],
  description: "",
  featured: false,
};

export default function AdminPortfolio() {
  const list = useListPortfolio({}, { query: { queryKey: getListPortfolioQueryKey({}) } });
  const items = list.data ?? [];
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [open, setOpen] = useState(false);

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(item: PortfolioItem) { setEditing(item); setOpen(true); }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">Manage</p>
          <h1 className="font-display text-4xl" data-testid="text-projects-title">Projects</h1>
        </div>
        <Button size="lg" onClick={openCreate} data-testid="button-new-project">
          <Plus className="h-4 w-4 mr-2" /> New project
        </Button>
      </div>

      {list.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-20 text-center" data-testid="empty-projects">
          <p className="text-muted-foreground">No projects yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <ProjectCard key={item.id} item={item} onEdit={() => openEdit(item)} />
          ))}
        </div>
      )}

      <ProjectDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
      />
    </AdminLayout>
  );
}

function ProjectCard({ item, onEdit }: { item: PortfolioItem; onEdit: () => void }) {
  const qc = useQueryClient();
  const del = useDeletePortfolioItem();

  function handleDelete() {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    del.mutate(
      { id: item.id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListPortfolioQueryKey() });
          qc.invalidateQueries({ queryKey: getListFeaturedPortfolioQueryKey() });
          qc.invalidateQueries({ queryKey: getListPortfolioCategoriesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        },
      },
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card group" data-testid={`row-project-${item.id}`}>
      <div className="aspect-[4/3] relative bg-muted">
        <img src={imageUrl(item.coverImage)} alt={item.title} className="w-full h-full object-cover" />
        {item.featured && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-accent-foreground text-[10px] tracking-widest uppercase">
            <Star className="h-3 w-3" /> Featured
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg truncate" data-testid={`text-project-name-${item.id}`}>{item.title}</h3>
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground">{item.category}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit} data-testid={`button-edit-${item.id}`}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={del.isPending} data-testid={`button-delete-${item.id}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProjectDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PortfolioItem | null;
}) {
  const qc = useQueryClient();
  const create = useCreatePortfolioItem();
  const update = useUpdatePortfolioItem();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULTS,
    values: editing
      ? {
          title: editing.title,
          category: editing.category,
          coverImage: editing.coverImage,
          images: editing.images ?? [],
          description: editing.description ?? "",
          featured: editing.featured,
        }
      : DEFAULTS,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListPortfolioQueryKey() });
    qc.invalidateQueries({ queryKey: getListFeaturedPortfolioQueryKey() });
    qc.invalidateQueries({ queryKey: getListPortfolioCategoriesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      update.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            invalidate();
            onOpenChange(false);
            form.reset(DEFAULTS);
          },
        },
      );
    } else {
      create.mutate(
        { data: values },
        {
          onSuccess: () => {
            invalidate();
            onOpenChange(false);
            form.reset(DEFAULTS);
          },
        },
      );
    }
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-project">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">
            {editing ? "Edit project" : "New project"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4" data-testid="form-project">
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Project title" {...field} data-testid="input-project-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="A short, evocative description..." {...field} data-testid="input-project-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover image</FormLabel>
                  <FormControl>
                    <ImageUploader
                      mode="single"
                      value={field.value || null}
                      onChange={(v) => field.onChange(v ?? "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gallery images</FormLabel>
                  <FormControl>
                    <ImageUploader
                      mode="multiple"
                      value={field.value ?? []}
                      onChange={(v) => field.onChange(v)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div>
                    <FormLabel className="text-base">Feature on home page</FormLabel>
                    <p className="text-xs text-muted-foreground mt-1">Featured projects appear in the selected work grid.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-project-featured" />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-project">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} data-testid="button-save-project">
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : (editing ? "Save changes" : "Create project")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
