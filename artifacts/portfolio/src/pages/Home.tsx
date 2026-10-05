import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  useListFeaturedPortfolio,
  getListFeaturedPortfolioQueryKey,
  useListTestimonials,
  getListTestimonialsQueryKey,
  useListServices,
  getListServicesQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { imageUrl } from "@/lib/imageUrl";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Home() {
  const featured = useListFeaturedPortfolio({
    query: { queryKey: getListFeaturedPortfolioQueryKey() },
  });
  const testimonials = useListTestimonials({
    query: { queryKey: getListTestimonialsQueryKey() },
  });
  const services = useListServices({
    query: { queryKey: getListServicesQueryKey() },
  });
  const [visibleCount, setVisibleCount] = useState(1);
  const [servicePage, setServicePage] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setVisibleCount(window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1);
    };
    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  const featuredItems = featured.data ?? [];
  const heroFeature = featuredItems[0];
  const serviceItems = [...(services.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const servicePageCount = Math.max(1, Math.ceil(serviceItems.length / visibleCount));
  const safeServicePage = Math.min(servicePage, servicePageCount - 1);
  const visibleServices = serviceItems.slice(safeServicePage * visibleCount, (safeServicePage + 1) * visibleCount);

  function moveServicePage(direction: number) {
    setServicePage((current) => (current + direction + servicePageCount) % servicePageCount);
  }

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative isolate overflow-hidden" data-testid="section-hero">
        {heroFeature?.coverImage && (
          <div className="absolute inset-0 -z-10">
            <img
              src={imageUrl(heroFeature.coverImage)}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          </div>
        )}
        {!heroFeature && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-card via-background to-muted" />
        )}

        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-32 lg:pt-40 lg:pb-44 min-h-[88vh] flex flex-col justify-end">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs tracking-[0.4em] uppercase text-accent mb-6"
          >
            Photography Studio · Est. 2014
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl sm:text-7xl lg:text-[8.5rem] leading-[0.95] tracking-tight max-w-5xl text-balance"
            data-testid="text-hero-title"
          >
            Light, made <em className="text-accent not-italic">memorable</em>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-8 text-base sm:text-lg text-foreground/80 max-w-xl"
          >
            Lumière is a boutique photography studio crafting cinematic stories for weddings,
            portraits, events, and the brands behind them.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              href="/portfolio"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent text-accent-foreground text-sm tracking-wide uppercase hover:bg-accent/90 transition"
              data-testid="link-hero-portfolio"
            >
              View the work
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-foreground/30 hover:border-foreground/60 text-sm tracking-wide uppercase transition"
              data-testid="link-hero-contact"
            >
              Start a project
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-border" data-testid="section-services">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="max-w-2xl mb-16"
          >
            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-5">What we do</p>
            <h2 className="font-display text-4xl lg:text-5xl text-balance" data-testid="text-services-title">
              A considered eye, whatever the story.
            </h2>
            <p className="mt-5 text-muted-foreground text-lg">
              Whether it's a quiet portrait or a thousand-guest evening, the approach is the same:
              listen, observe, then make pictures that hold up for a lifetime.
            </p>
          </motion.div>

          {services.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-testid="services-loading">
              {Array.from({ length: visibleCount }).map((_, index) => (
                <div key={index} className="animate-pulse overflow-hidden rounded-sm border border-border bg-card">
                  <div className="aspect-[5/3] bg-muted/60" />
                  <div className="space-y-3 p-7"><div className="h-6 w-2/3 rounded bg-muted" /><div className="h-16 rounded bg-muted/70" /></div>
                </div>
              ))}
            </div>
          ) : services.isError ? (
            <div className="border border-border bg-card/60 px-6 py-10 text-center" data-testid="services-error">
              <p className="font-display text-2xl">Our stories are taking a moment.</p>
              <p className="mt-2 text-sm text-muted-foreground">Please try again in a little while.</p>
              <button type="button" onClick={() => services.refetch()} className="mt-5 text-xs uppercase tracking-[0.2em] text-accent underline underline-offset-4" data-testid="button-retry-services">Try again</button>
            </div>
          ) : serviceItems.length === 0 ? (
            <div className="border border-dashed border-border px-6 py-14 text-center" data-testid="services-empty">
              <p className="font-display text-2xl">New stories are taking shape.</p>
              <p className="mt-2 text-sm text-muted-foreground">Our services will be here soon.</p>
            </div>
          ) : (
            <div className="space-y-7" data-testid="services-carousel">
              <div
                className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                aria-live="polite"
                aria-atomic="true"
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") moveServicePage(-1);
                  if (event.key === "ArrowRight") moveServicePage(1);
                }}
                data-testid="service-carousel-items"
              >
                {visibleServices.map((service) => (
                  <article key={service.id} className="group overflow-hidden border border-border bg-card" data-testid={`card-service-${service.id}`}>
                    <div className="relative aspect-[5/3] overflow-hidden bg-muted">
                      <img src={imageUrl(service.image)} alt={service.title} className="h-full w-full object-cover transition-transform duration-700 motion-reduce:transition-none group-hover:scale-[1.035]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/35 to-transparent" />
                    </div>
                    <div className="p-6 lg:p-8">
                      <p className="mb-3 text-[10px] tracking-[0.28em] uppercase text-accent">Lumière / {String(service.sortOrder + 1).padStart(2, "0")}</p>
                      <h3 className="font-display text-3xl" data-testid={`text-service-title-${service.id}`}>{service.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground" data-testid={`text-service-description-${service.id}`}>{service.description}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-5">
                <span className="font-mono text-xs tracking-[0.14em] text-muted-foreground" data-testid="text-services-pagination">
                  {String(safeServicePage + 1).padStart(2, "0")} <span className="mx-2 text-accent">/</span> {String(servicePageCount).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveServicePage(-1)} aria-label="Previous services" disabled={servicePageCount <= 1} className="inline-flex h-11 w-11 items-center justify-center border border-border transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35" data-testid="button-previous-services"><ArrowLeft className="h-4 w-4" /></button>
                  <div className="flex items-center gap-2 px-2" aria-label="Choose services page">
                    {Array.from({ length: servicePageCount }).map((_, index) => (
                      <button key={index} type="button" aria-label={`Go to services page ${index + 1}`} aria-current={safeServicePage === index ? "page" : undefined} onClick={() => setServicePage(index)} className={`h-2 transition-all motion-reduce:transition-none ${safeServicePage === index ? "w-8 bg-accent" : "w-2 bg-border hover:bg-accent/60"}`} data-testid={`button-services-page-${index + 1}`} />
                    ))}
                  </div>
                  <button type="button" onClick={() => moveServicePage(1)} aria-label="Next services" disabled={servicePageCount <= 1} className="inline-flex h-11 w-11 items-center justify-center border border-border transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35" data-testid="button-next-services"><ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Work */}
      <section className="border-t border-border bg-card/30" data-testid="section-featured">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
            >
              <p className="text-xs tracking-[0.4em] uppercase text-accent mb-5">Selected Work</p>
              <h2 className="font-display text-4xl lg:text-5xl" data-testid="text-featured-title">
                Recent stories
              </h2>
            </motion.div>
            <Link
              href="/portfolio"
              className="text-sm tracking-widest uppercase text-foreground/80 hover:text-accent transition inline-flex items-center gap-2"
              data-testid="link-view-all"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-[4/5] bg-muted/40 rounded-md animate-pulse" />
              ))}
            </div>
          ) : featuredItems.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-md" data-testid="text-no-featured">
              <p className="text-muted-foreground">Featured projects appear here once added in the studio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  transition={{ delay: (i % 3) * 0.08 }}
                >
                  <Link
                    href={`/portfolio/${item.id}`}
                    className="group block"
                    data-testid={`link-featured-${item.id}`}
                  >
                    <div className="relative overflow-hidden rounded-md aspect-[4/5] bg-muted">
                      <img
                        src={imageUrl(item.coverImage)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-4 flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-xl">{item.title}</h3>
                      <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground">{item.category}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border" data-testid="section-testimonials">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-5">Words from clients</p>
            <h2 className="font-display text-4xl lg:text-5xl text-balance" data-testid="text-testimonials-title">
              Trusted by people who care how their story is told.
            </h2>
          </motion.div>

          {testimonials.isLoading ? (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-48 bg-muted/40 rounded-lg animate-pulse" />
              <div className="h-48 bg-muted/40 rounded-lg animate-pulse" />
            </div>
          ) : (testimonials.data?.length ?? 0) === 0 ? (
            <p className="text-center text-muted-foreground" data-testid="text-no-testimonials">
              Client words appear here once added.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {(testimonials.data ?? []).slice(0, 4).map((t, i) => (
                <motion.figure
                  key={t.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  transition={{ delay: (i % 2) * 0.1 }}
                  className="border border-border rounded-lg p-8 lg:p-10 bg-card"
                  data-testid={`card-testimonial-${t.id}`}
                >
                  <div className="flex gap-1 text-accent mb-5">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-accent" />
                    ))}
                  </div>
                  <blockquote className="font-display text-2xl leading-snug text-balance">
                    "{t.review}"
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    {t.photo && (
                      <img
                        src={imageUrl(t.photo)}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm tracking-widest uppercase text-muted-foreground">
                      — {t.name}
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground" data-testid="section-cta">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
          >
            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-6">Inquiries open</p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-balance" data-testid="text-cta-title">
              Tell us what you're planning.
            </h2>
            <p className="mt-6 text-base lg:text-lg text-primary-foreground/75 max-w-xl mx-auto">
              We take on a small number of commissions each season. Reach out and let's see if we're a fit.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-10 px-9 py-4 rounded-full bg-accent text-accent-foreground text-sm tracking-wide uppercase hover:bg-accent/90 transition"
              data-testid="link-cta-contact"
            >
              Begin a conversation
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
