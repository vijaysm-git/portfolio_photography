import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminLogin,
  useGetAdminSession,
  getGetAdminSessionQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Camera, Loader2, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type Values = z.infer<typeof schema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const session = useGetAdminSession({ query: { queryKey: getGetAdminSessionQueryKey() } });
  const login = useAdminLogin();

  useEffect(() => {
    if (session.data?.authenticated) {
      setLocation("/admin");
    }
  }, [session.data, setLocation]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: Values) {
    login.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          qc.setQueryData(getGetAdminSessionQueryKey(), data);
          setLocation("/admin");
        },
        onError: () => {
          form.setError("password", { message: "Invalid email or password" });
        },
      },
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-card opacity-95" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5" data-testid="link-back-home">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-accent">
            <Camera className="h-4 w-4" />
          </span>
          <span className="font-display text-2xl">Lumière<span className="text-accent">.</span></span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-6">Studio Admin</p>
          <h1 className="font-display text-5xl leading-tight">Sign in to manage the studio.</h1>
          <p className="mt-6 text-primary-foreground/70 text-lg">
            Update featured work, respond to inquiries, and curate testimonials — all from a single quiet place.
          </p>
        </div>

        <p className="relative text-xs text-primary-foreground/50 tracking-widest uppercase">
          Restricted area
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8 text-sm text-muted-foreground hover:text-accent" data-testid="link-back-mobile">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>

          <div className="mb-10">
            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4">Welcome back</p>
            <h2 className="font-display text-4xl">Sign in</h2>
            <p className="mt-3 text-muted-foreground">Use your studio admin credentials to continue.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-login">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="username" placeholder="admin@lumiere.studio" {...field} data-testid="input-login-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} data-testid="input-login-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={login.isPending} data-testid="button-login-submit">
                {login.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>

          <Link href="/" className="hidden lg:inline-flex items-center gap-2 mt-10 text-sm text-muted-foreground hover:text-accent" data-testid="link-back-home-bottom">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
