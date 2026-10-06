import { type MouseEvent, type ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Camera, Instagram } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/#studio-map", label: "Find us" },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  function handleFindUsClick(event: MouseEvent<HTMLAnchorElement>) {
    if (location !== "/") return;
    event.preventDefault();
    document.getElementById("studio-map")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/85 backdrop-blur-md border-b border-border/60"
            : "bg-transparent border-b border-transparent"
        }`}
        data-testid="header-public"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-home-brand">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-accent">
              <Camera className="h-4 w-4" />
            </span>
            <span className="font-display text-2xl tracking-tight">
              {siteConfig.name}<span className="text-accent">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10" data-testid="nav-public">
            {NAV_LINKS.map((l) => {
              const active = location === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={l.href === "/#studio-map" ? handleFindUsClick : undefined}
                  className={`text-sm tracking-wide uppercase transition ${
                    active ? "text-accent" : "text-foreground/80 hover:text-foreground"
                  }`}
                  data-testid={`link-nav-${l.label.toLowerCase().replace(" ", "-")}`}
                >
                  {l.href === "/#studio-map" && (
                    <span aria-hidden="true" className="mr-1">
                      📍
                    </span>
                  )}
                  {l.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              className="text-sm tracking-wide uppercase px-5 py-2.5 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition"
              data-testid="link-cta-book"
            >
              Reach us!
            </Link>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 -mr-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            data-testid="button-menu-toggle"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-background" data-testid="nav-mobile">
            <div className="px-6 py-4 flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={l.href === "/#studio-map" ? handleFindUsClick : undefined}
                  className="py-2 text-base"
                  data-testid={`link-mobile-${l.label.toLowerCase().replace(" ", "-")}`}
                >
                  {l.href === "/#studio-map" && (
                    <span aria-hidden="true" className="mr-1">
                      📍
                    </span>
                  )}
                  {l.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="mt-2 text-sm tracking-wide uppercase px-5 py-3 rounded-full bg-accent text-accent-foreground text-center"
                data-testid="link-mobile-cta-book"
              >
                Reach us!
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20">{children}</main>

      <footer className="border-t border-border mt-24 bg-card/40" data-testid="footer-public">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-accent">
                <Camera className="h-4 w-4" />
              </span>
              <span className="font-display text-2xl">{siteConfig.name}<span className="text-accent">.</span></span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              {siteConfig.tagline ??
                "Address : No.3, Velkumaran Complex ,Siluvathur Road, Jambuliyampatti Bus Stop Opposite , Dindigul - 624005"}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Studio</p>
            <ul className="space-y-2 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={
                      l.href === "/#studio-map" ? handleFindUsClick : undefined
                    }
                    className="hover:text-accent transition"
                    data-testid={`link-footer-${l.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {(siteConfig.email || siteConfig.instagramUrl) && (
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Find us</p>
              {siteConfig.email && (
                <a className="text-sm hover:text-accent" href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </a>
              )}
              {siteConfig.instagramUrl && (
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-accent transition"
                  data-testid="link-footer-instagram"
                >
                  <Instagram className="h-4 w-4" />
                  {siteConfig.instagramHandle}
                </a>
              )}
            </div>
          )}
        </div>
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Crafted with intention</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
