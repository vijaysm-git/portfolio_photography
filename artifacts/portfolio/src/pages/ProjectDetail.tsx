import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetPortfolioItem,
  getGetPortfolioItemQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { imageUrl } from "@/lib/imageUrl";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const project = useGetPortfolioItem(id, {
    query: { enabled: Number.isFinite(id), queryKey: getGetPortfolioItemQueryKey(id) },
  });

  if (project.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="project-loading">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (project.isError || !project.data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center" data-testid="project-error">
        <h1 className="font-display text-4xl mb-4">Project not found</h1>
        <p className="text-muted-foreground mb-8">The piece you're looking for has moved or no longer exists.</p>
        <Link href="/portfolio" className="inline-flex items-center gap-2 text-accent hover:underline" data-testid="link-back-portfolio">
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>
      </div>
    );
  }

  const item = project.data;
  const allImages = [item.coverImage, ...(item.images ?? []).filter((i) => i !== item.coverImage)];

  function open(i: number) { setLightboxIdx(i); }
  function close() { setLightboxIdx(null); }
  function prev() { setLightboxIdx((i) => (i === null ? null : (i - 1 + allImages.length) % allImages.length)); }
  function next() { setLightboxIdx((i) => (i === null ? null : (i + 1) % allImages.length)); }

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-10">
        <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition" data-testid="link-back">
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>
      </div>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4" data-testid="text-project-category">
              {item.category}
            </p>
            <h1 className="font-display text-5xl lg:text-7xl text-balance" data-testid="text-project-name">
              {item.title}
            </h1>
          </div>
          <div className="lg:col-span-5">
            {item.description && (
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed" data-testid="text-project-description">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
        <motion.button
          type="button"
          onClick={() => open(0)}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="block w-full overflow-hidden rounded-md bg-muted aspect-[16/10]"
          data-testid="button-cover-image"
        >
          <img src={imageUrl(item.coverImage)} alt={item.title} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700" />
        </motion.button>

        {allImages.length > 1 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
            {allImages.slice(1).map((src, i) => {
              const realIdx = i + 1;
              return (
                <motion.button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => open(realIdx)}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
                  className="block overflow-hidden rounded-md bg-muted aspect-[4/5]"
                  data-testid={`button-gallery-${i}`}
                >
                  <img src={imageUrl(src)} alt="" className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-700" />
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={close}
            data-testid="lightbox"
          >
            <button type="button" onClick={close} className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted/40 transition" data-testid="button-lightbox-close">
              <X className="h-6 w-6" />
            </button>
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-card/60 hover:bg-card transition"
                  data-testid="button-lightbox-prev"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-card/60 hover:bg-card transition"
                  data-testid="button-lightbox-next"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              src={imageUrl(allImages[lightboxIdx])}
              alt=""
              className="max-h-[90vh] max-w-[92vw] object-contain rounded-md"
              onClick={(e) => e.stopPropagation()}
              data-testid="img-lightbox"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
