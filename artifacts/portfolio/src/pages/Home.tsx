import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useListFeaturedPortfolio,
  getListFeaturedPortfolioQueryKey,
  useListTestimonials,
  getListTestimonialsQueryKey,
} from "@workspace/api-client-react";
import { ArrowUpRight, Camera, Heart, Sparkles, Star } from "lucide-react";
import { imageUrl } from "@/lib/imageUrl";

const SERVICES = [
  {
    icon: Heart,
    title: "Weddings",
    body: "Quietly observed, gently directed. We document the day as it actually unfolds — vows, light, hands held a beat too long.",
  },
  {
    icon: Sparkles,
    title: "Events",
    body: "Editorial coverage for galas, launches, and milestone celebrations. Stories told in light, not lists.",
  },
  {
    icon: Camera,
    title: "Portraits",
    body: "Couples, families, founders, individuals. Sessions that feel like conversation and look like cinema.",
  },
  {
    icon: Star,
    title: "Studio & Editorial",
    body: "Commercial, brand, and editorial production from concept through final frame. Built around your story.",
  },
];

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

  const featuredItems = featured.data ?? [];
  const heroFeature = featuredItems[0];

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
              Four practices, one sensibility.
            </h2>
            <p className="mt-5 text-muted-foreground text-lg">
              Whether it's a quiet portrait or a thousand-guest evening, the approach is the same:
              listen, observe, then make pictures that hold up for a lifetime.
            </p>
          </motion.div>

          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden border border-border">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card p-8 lg:p-10 flex flex-col gap-4"
                  data-testid={`card-service-${s.title.toLowerCase().split(" ")[0]}`}
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-2xl">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </motion.div>
              );
            })}
          </div>
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
