import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminSessionSettingsQueryKey,
  getGetAdminSessionQueryKey,
  useChangeAdminCredentials,
  useGetAdminSession,
  useGetAdminSessionSettings,
  useUpdateAdminSessionSettings,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    email: z.string().email("Enter a valid email address"),
    newPassword: z
      .string()
      .refine(
        (value) =>
          value.length === 0 || (value.length >= 12 && value.length <= 128),
        { message: "Use between 12 and 128 characters" },
      ),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export default function AdminAccount() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const session = useGetAdminSession({
    query: { queryKey: getGetAdminSessionQueryKey() },
  });
  const sessionSettings = useGetAdminSessionSettings();
  const updateSessionSettings = useUpdateAdminSessionSettings();
  const changeCredentials = useChangeAdminCredentials();
  const [sessionSettingsError, setSessionSettingsError] = useState<
    string | null
  >(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      currentPassword: "",
      email: session.data?.email ?? "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const email = values.email.trim().toLowerCase();
    const currentEmail = session.data?.email?.trim().toLowerCase();
    const data: {
      currentPassword: string;
      email?: string;
      newPassword?: string;
    } = {
      currentPassword: values.currentPassword,
    };
    if (email !== currentEmail) data.email = email;
    if (values.newPassword) data.newPassword = values.newPassword;
    if (!data.email && !data.newPassword) {
      form.setError("root", {
        message: "Change your email or enter a new password.",
      });
      return;
    }

    form.clearErrors("root");
    try {
      await changeCredentials.mutateAsync({ data });
      queryClient.setQueryData(getGetAdminSessionQueryKey(), {
        authenticated: false,
        email: null,
      });
      setLocation("/admin/login?credentialsChanged=1");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not update account credentials.";
      form.setError("root", { message });
    }
  }

  function onSessionDurationChange(value: string) {
    const sessionDurationHours = Number(value);
    if (sessionDurationHours !== 12 && sessionDurationHours !== 24) return;

    setSessionSettingsError(null);
    updateSessionSettings.mutate(
      { data: { sessionDurationHours } },
      {
        onSuccess: (settings) => {
          queryClient.setQueryData(
            getGetAdminSessionSettingsQueryKey(),
            settings,
          );
        },
        onError: (error) => {
          setSessionSettingsError(
            error instanceof Error
              ? error.message
              : "Could not update the session expiry.",
          );
        },
      },
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-xs uppercase tracking-[0.4em] text-accent">
          Security
        </p>
        <h1
          className="font-display text-4xl"
          data-testid="text-admin-account-title"
        >
          Admin account
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Updating your email or password requires your current password and
          signs out all admin sessions.
        </p>

        <section
          className="mt-8 space-y-4 border border-border bg-card p-6"
          aria-labelledby="session-security-heading"
        >
          <div>
            <h2 id="session-security-heading" className="font-display text-2xl">
              Session security
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose when newly created admin sessions expire. This change
              applies the next time you sign in; active sessions keep their
              existing expiry.
            </p>
          </div>
          <div className="max-w-sm space-y-2">
            <label
              htmlFor="admin-session-duration"
              className="text-sm font-medium"
            >
              Session duration
            </label>
            {sessionSettings.isLoading ? (
              <p className="text-sm text-muted-foreground" role="status">
                Loading session settings...
              </p>
            ) : sessionSettings.isError ? (
              <p className="text-sm text-destructive" role="alert">
                Could not load the session expiry setting.
              </p>
            ) : sessionSettings.data ? (
              <Select
                value={String(sessionSettings.data.sessionDurationHours)}
                onValueChange={onSessionDurationChange}
                disabled={updateSessionSettings.isPending}
              >
                <SelectTrigger id="admin-session-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-destructive" role="alert">
                Session expiry settings are unavailable.
              </p>
            )}
          </div>
          {updateSessionSettings.isPending && (
            <p className="text-sm text-muted-foreground" role="status">
              Saving session duration...
            </p>
          )}
          {sessionSettingsError && (
            <p className="text-sm text-destructive" role="alert">
              {sessionSettingsError}
            </p>
          )}
        </section>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-8 space-y-6 border border-border bg-card p-6"
            data-testid="form-admin-account"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Leave blank to keep the current password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              disabled={changeCredentials.isPending}
              data-testid="button-save-admin-account"
            >
              {changeCredentials.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save and sign out
            </Button>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
