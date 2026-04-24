import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListPortfolio,
  getListPortfolioQueryKey,
  type ListPortfolioParams,
} from "@workspace/api-client-react";
import { imageUrl } from "@/lib/imageUrl";

const CATEGORIES: Array<{ key: ListPortfolioParams["category"] | "all"; label: string }> = [
  { key: "all", label: "All Work" },
  { key: "wedding", label: "Weddings" },
  { key: "events", label: "Events" },
  { key: "portrait", label: "Portraits" },
  { key: "studio", label: "Studio" },
];

export default function Portfolio() {
  const [category, setCategory] = useState<ListPortfolioParams["category"] | "all">("all");
  const params: ListPortfolioParams =
    category === "all" ? {} : { category: category as ListPortfolioParams["category"] };

  const list = useListPortfolio(params, {
    query: { queryKey: getListPortfolioQueryKey(params) },
  });
  const items = list.data ?? [];

  return (
    <div className="bg-background">
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-5">Portfolio</p>
          <h1 className="font-display text-5xl lg:text-7xl text-balance max-w-3xl" data-testid="text-portfolio-title">
            A working archive.
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-2xl">
            Selected projects from across the studio's practice. Filter by category or explore the full body of work.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-wrap gap-3" data-testid="filter-categories">
          {CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <button
                key={c.key as string}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`px-5 py-2 rounded-full text-xs tracking-widest uppercase transition border ${
                  active
                    ? "bg-accent text-accent-foreground border-accent"
                    : "border-border text-foreground/70 hover:border-foreground/40 hover:text-foreground"
                }`}
                data-testid={`button-filter-${c.key}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
        {list.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-[4/5] bg-muted/40 rounded-md animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-md" data-testid="text-no-projects">
            <p className="text-muted-foreground">No projects in this category yet.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, delay: (i % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={`/portfolio/${item.id}`}
                    className="group block"
                    data-testid={`link-project-${item.id}`}
                  >
                    <div className="relative overflow-hidden rounded-md aspect-[4/5] bg-muted">
                      <img
                        src={imageUrl(item.coverImage)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs tracking-[0.25em] uppercase text-accent">{item.category}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-xl group-hover:text-accent transition-colors" data-testid={`text-project-title-${item.id}`}>
                        {item.title}
                      </h3>
                      <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground">{item.category}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
