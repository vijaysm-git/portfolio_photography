import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTestimonials,
  useCreateTestimonial,
  useDeleteTestimonial,
  useBulkArchiveContent,
  getListTestimonialsQueryKey,
  getListRecentlyDeletedContentQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/ImageUploader";
import { imageUrl } from "@/lib/imageUrl";
import { Plus, Trash2, Star, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  name: z.string().min(1, "Required"),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(1, "Required"),
  photo: z.string().nullable().default(null),
});

type Values = z.infer<typeof schema>;

export default function AdminTestimonials() {
  const list = useListTestimonials({
    query: { queryKey: getListTestimonialsQueryKey() },
  });
  const items = list.data ?? [];
  const qc = useQueryClient();
  const del = useDeleteTestimonial();
  const bulkArchive = useBulkArchiveContent();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [archiveNotice, setArchiveNotice] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const selectedActiveIds = selectedIds.filter((id) =>
    items.some((item) => item.id === id),
  );

  function handleDelete(id: number) {
    if (
      !window.confirm(
        "Move this testimonial to Recently deleted? You can restore it for 15 days.",
      )
    )
      return;
    del.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          qc.invalidateQueries({
            queryKey: getListRecentlyDeletedContentQueryKey(),
          });
        },
      },
    );
  }

  function handleBulkArchive() {
    if (!selectedActiveIds.length) return;
    setArchiveNotice(null);
    setArchiveError(null);
    if (
      !window.confirm(
        `Move ${selectedActiveIds.length} selected testimonial${selectedActiveIds.length === 1 ? "" : "s"} to Recently deleted? You can restore them for 15 days.`,
      )
    ) {
      return;
    }
    bulkArchive.mutate(
      { data: { type: "testimonial", ids: selectedActiveIds } },
      {
        onSuccess: ({ archivedCount }) => {
          setSelectedIds([]);
          setArchiveNotice(
            `${archivedCount} testimonial${archivedCount === 1 ? "" : "s"} moved to Recently deleted.`,
          );
          qc.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          qc.invalidateQueries({
            queryKey: getListRecentlyDeletedContentQueryKey(),
          });
        },
        onError: (error) => {
          setArchiveError(
            error instanceof Error
              ? error.message
              : "Could not archive the selected testimonials.",
          );
        },
      },
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">
            Manage
          </p>
          <h1
            className="font-display text-4xl"
            data-testid="text-testimonials-title"
          >
            Testimonials
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedActiveIds.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkArchive}
              disabled={bulkArchive.isPending}
              data-testid="button-archive-selected-testimonials"
            >
              {bulkArchive.isPending
                ? "Archiving..."
                : `Archive selected (${selectedActiveIds.length})`}
            </Button>
          )}
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            data-testid="button-new-testimonial"
          >
            <Plus className="h-4 w-4 mr-2" /> Add testimonial
          </Button>
        </div>
      </div>

      {archiveError && (
        <p className="mb-5 text-sm text-destructive" role="alert">
          {archiveError}
        </p>
      )}
      {archiveNotice && (
        <p className="mb-5 text-sm text-muted-foreground" role="status">
          {archiveNotice}
        </p>
      )}

      {list.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div
          className="border border-dashed border-border rounded-lg py-20 text-center"
          data-testid="empty-testimonials"
        >
          <p className="text-muted-foreground">No testimonials yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          <label className="md:col-span-2 flex w-fit items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={
                selectedActiveIds.length === items.length
                  ? true
                  : selectedActiveIds.length > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(checked) =>
                setSelectedIds(
                  checked === true ? items.map((item) => item.id) : [],
                )
              }
              aria-label="Select all testimonials"
            />
            Select all testimonials
          </label>
          {items.map((t) => (
            <div
              key={t.id}
              className="border border-border rounded-lg bg-card p-6"
              data-testid={`row-testimonial-${t.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {t.photo ? (
                    <div className="relative">
                      <img
                        src={imageUrl(t.photo)}
                        alt={t.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <Checkbox
                        className="absolute -right-2 -top-2 bg-background"
                        checked={selectedIds.includes(t.id)}
                        onCheckedChange={(checked) =>
                          setSelectedIds((current) =>
                            checked === true
                              ? [...new Set([...current, t.id])]
                              : current.filter((id) => id !== t.id),
                          )
                        }
                        aria-label={`Select testimonial from ${t.name}`}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <Checkbox
                        className="absolute -right-2 -top-2 bg-background"
                        checked={selectedIds.includes(t.id)}
                        onCheckedChange={(checked) =>
                          setSelectedIds((current) =>
                            checked === true
                              ? [...new Set([...current, t.id])]
                              : current.filter((id) => id !== t.id),
                          )
                        }
                        aria-label={`Select testimonial from ${t.name}`}
                      />
                    </div>
                  )}
                  <div>
                    <p
                      className="font-medium"
                      data-testid={`text-testimonial-name-${t.id}`}
                    >
                      {t.name}
                    </p>
                    <div className="flex gap-0.5 text-accent mt-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-accent" />
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(t.id)}
                  disabled={del.isPending}
                  data-testid={`button-delete-testimonial-${t.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Archive
                </Button>
              </div>
              <blockquote className="mt-4 text-sm text-muted-foreground leading-relaxed">
                "{t.review}"
              </blockquote>
              {del.isError && (
                <p className="mt-3 text-xs text-destructive" role="alert">
                  Could not move this testimonial to Recently deleted.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <TestimonialDialog open={open} onOpenChange={setOpen} />
    </AdminLayout>
  );
}

function TestimonialDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const create = useCreateTestimonial();
  const [photoUploading, setPhotoUploading] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", rating: 5, review: "", photo: null },
  });

  function onSubmit(values: Values) {
    create.mutate(
      { data: values },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          onOpenChange(false);
          form.reset({ name: "", rating: 5, review: "", photo: null });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-testimonial">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">
            Add testimonial
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 mt-4"
            data-testid="form-testimonial"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Client name"
                      {...field}
                      data-testid="input-testimonial-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <div className="flex gap-1.5" data-testid="rating-picker">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => field.onChange(n)}
                        className="p-1"
                        data-testid={`button-rating-${n}`}
                      >
                        <Star
                          className={`h-7 w-7 transition ${n <= field.value ? "fill-accent text-accent" : "text-muted-foreground"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Their words..."
                      {...field}
                      data-testid="input-testimonial-review"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo (optional)</FormLabel>
                  <FormControl>
                    <ImageUploader
                      mode="single"
                      purpose="testimonials"
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      onUploadingChange={setPhotoUploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-testimonial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || photoUploading}
                data-testid="button-save-testimonial"
              >
                {create.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Add testimonial"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
