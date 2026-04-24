import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetAdminStats,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Images, MessageSquareQuote, Inbox, ArrowUpRight, Loader2 } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  wedding: "Weddings",
  events: "Events",
  portrait: "Portraits",
  studio: "Studio",
};

export default function AdminDashboard() {
  const stats = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">Overview</p>
        <h1 className="font-display text-4xl mb-2" data-testid="text-dashboard-title">Studio dashboard</h1>
        <p className="text-muted-foreground">A quick read on the studio's content and inbox.</p>

        {stats.isLoading ? (
          <div className="mt-12 flex items-center gap-2 text-muted-foreground" data-testid="stats-loading">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading stats...
          </div>
        ) : (
          <>
            <div className="mt-10 grid sm:grid-cols-3 gap-5">
              <StatCard
                href="/admin/portfolio"
                label="Projects"
                value={stats.data?.portfolioCount ?? 0}
                icon={<Images className="h-5 w-5" />}
                testid="stat-projects"
              />
              <StatCard
                href="/admin/testimonials"
                label="Testimonials"
                value={stats.data?.testimonialCount ?? 0}
                icon={<MessageSquareQuote className="h-5 w-5" />}
                testid="stat-testimonials"
              />
              <StatCard
                href="/admin/inquiries"
                label="Inquiries"
                value={stats.data?.contactCount ?? 0}
                icon={<Inbox className="h-5 w-5" />}
                testid="stat-inquiries"
              />
            </div>

            <div className="mt-12 border border-border rounded-lg bg-card p-8">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="font-display text-2xl">By category</h2>
                <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">Portfolio breakdown</p>
              </div>
              {(stats.data?.categoryCounts ?? []).length === 0 ? (
                <p className="text-muted-foreground" data-testid="text-no-categories">No projects yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(stats.data?.categoryCounts ?? []).map((c) => (
                    <div key={c.category} className="flex items-center justify-between p-4 rounded-md border border-border" data-testid={`category-${c.category}`}>
                      <span className="text-sm uppercase tracking-widest text-muted-foreground">{CATEGORY_LABEL[c.category] ?? c.category}</span>
                      <span className="font-display text-3xl text-accent">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({
  href, label, value, icon, testid,
}: { href: string; label: string; value: number; icon: React.ReactNode; testid: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href={href}
        className="group block p-6 rounded-lg border border-border bg-card hover:border-accent/40 transition"
        data-testid={testid}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            {icon}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition" />
        </div>
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1">{label}</p>
        <p className="font-display text-5xl">{value}</p>
      </Link>
    </motion.div>
  );
}
