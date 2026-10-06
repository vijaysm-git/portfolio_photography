import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import Home from "@/pages/Home";
import Portfolio from "@/pages/Portfolio";
import ProjectDetail from "@/pages/ProjectDetail";
import Contact from "@/pages/Contact";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminPortfolio from "@/pages/AdminPortfolio";
import AdminTestimonials from "@/pages/AdminTestimonials";
import AdminInquiries from "@/pages/AdminInquiries";
import AdminServices from "@/pages/AdminServices";
import AdminAccount from "@/pages/AdminAccount";
import AdminHomepage from "@/pages/AdminHomepage";
import AdminRecentlyDeleted from "@/pages/AdminRecentlyDeleted";
import AdminStorage from "@/pages/AdminStorage";
import NotFound from "@/pages/not-found";
import { siteConfig } from "@/lib/siteConfig";

function PublicRoute({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/login">
        <AdminLogin />
      </Route>
      <Route path="/admin">
        <AdminDashboard />
      </Route>
      <Route path="/admin/portfolio">
        <AdminPortfolio />
      </Route>
      <Route path="/admin/testimonials">
        <AdminTestimonials />
      </Route>
      <Route path="/admin/inquiries">
        <AdminInquiries />
      </Route>
      <Route path="/admin/services">
        <AdminServices />
      </Route>
      <Route path="/admin/homepage">
        <AdminHomepage />
      </Route>
      <Route path="/admin/account">
        <AdminAccount />
      </Route>
      <Route path="/admin/recently-deleted">
        <AdminRecentlyDeleted />
      </Route>
      <Route path="/admin/storage">
        <AdminStorage />
      </Route>

      <Route path="/">
        <PublicRoute>
          <Home />
        </PublicRoute>
      </Route>
      <Route path="/portfolio">
        <PublicRoute>
          <Portfolio />
        </PublicRoute>
      </Route>
      <Route path="/portfolio/:id">
        <PublicRoute>
          <ProjectDetail />
        </PublicRoute>
      </Route>
      <Route path="/contact">
        <PublicRoute>
          <Contact />
        </PublicRoute>
      </Route>

      <Route>
        <PublicRoute>
          <NotFound />
        </PublicRoute>
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.title = siteConfig.name;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
