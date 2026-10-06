import { type ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetAdminSession,
  getGetAdminSessionQueryKey,
  useAdminLogout,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Images,
  MessageSquareQuote,
  Inbox,
  LogOut,
  Camera,
  Loader2,
  Aperture,
  UserRoundCog,
  PanelsTopLeft,
  Trash2,
  HardDrive,
} from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/portfolio", label: "Projects", icon: Images },
  { href: "/admin/services", label: "Services", icon: Aperture },
  { href: "/admin/homepage", label: "Homepage", icon: PanelsTopLeft },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    icon: MessageSquareQuote,
  },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/account", label: "Account", icon: UserRoundCog },
  { href: "/admin/recently-deleted", label: "Recently deleted", icon: Trash2 },
  { href: "/admin/storage", label: "Storage usage", icon: HardDrive },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const session = useGetAdminSession({
    query: { queryKey: getGetAdminSessionQueryKey() },
  });
  const logout = useAdminLogout();
  const qc = useQueryClient();

  useEffect(() => {
    if (session.data && !session.data.authenticated) {
      setLocation("/admin/login");
    }
  }, [session.data, setLocation]);

  if (session.isLoading || (session.data && !session.data.authenticated)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-testid="admin-loading"
      >
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        qc.setQueryData(getGetAdminSessionQueryKey(), {
          authenticated: false,
          email: null,
        });
        setLocation("/admin/login");
      },
    });
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className="hidden md:flex w-64 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground flex-col"
        data-testid="sidebar-admin"
      >
        <div className="px-6 py-7 border-b border-sidebar-border">
          <Link
            href="/admin"
            className="flex items-center gap-2.5"
            data-testid="link-admin-brand"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-accent">
              <Camera className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-xl leading-tight">
                {siteConfig.name}
              </span>
              <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                Studio Admin
              </span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              location === item.href ||
              (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
                data-testid={`link-admin-${item.label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition"
            data-testid="link-admin-view-site"
          >
            <Camera className="h-4 w-4" />
            View site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition disabled:opacity-50"
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            {logout.isPending ? "Signing out..." : "Sign out"}
          </button>
          {session.data?.email && (
            <p
              className="px-3 pt-3 text-xs text-muted-foreground truncate"
              data-testid="text-admin-email"
            >
              {session.data.email}
            </p>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="md:hidden border-b border-border px-5 py-4"
          data-testid="header-admin-mobile"
        >
          <div className="flex items-center justify-between">
            <Link href="/admin" className="font-display text-xl">
              {siteConfig.name} Admin
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-muted-foreground"
              data-testid="button-admin-logout-mobile"
            >
              Sign out
            </button>
          </div>
          <nav
            className="mt-4 flex gap-1 overflow-x-auto"
            aria-label="Admin navigation"
          >
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                location === item.href ||
                (item.href !== "/admin" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-xs transition ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                  }`}
                  data-testid={`link-admin-mobile-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
