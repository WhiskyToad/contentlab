import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { Button } from "~/lib/components/ui/button";
import { cn } from "~/lib/utils";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/lib/components/ui/card";
import { createServerFn } from "@tanstack/react-start";
import authClient from "~/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-form-adapter";

const REDIRECT_URL = "/dashboard";

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignInResult {
  error?: boolean;
  message?: string;
  success?: boolean;
}

// Create a server function for sign-in that matches the example
export const signInFn = createServerFn({ method: "POST" }).handler(async ({ data }: { data: SignInCredentials }) => {
  const { getSupabaseServerClient } = await import("~/lib/server/auth");
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

    if (error) {
      return {
        error: true,
        message: error.message,
      } as SignInResult;
    }
    
    // Return nothing on success, cookies are already set
    return { success: true } as SignInResult;
  });

export const Route = createFileRoute("/signin")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: search.error as string | undefined,
      redirect: search.redirect as string | undefined,
    };
  },
  beforeLoad: async ({ context, search }) => {
    // Check if user is already authenticated
    if (context.user) {
      throw redirect({
        to: search.redirect || REDIRECT_URL,
      });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const router = useRouter();

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const result = await signInFn({ data: value });

      if (result && result.error) {
        throw new Error(result.message || "Authentication failed");
      }

      await router.invalidate();
      router.navigate({ to: REDIRECT_URL });
    },
  });

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setFieldMeta("email", (prev) => ({ ...prev, isTouched: true }));
    form.setFieldMeta("password", (prev) => ({ ...prev, isTouched: true }));

    try {
      await form.handleSubmit();
    } catch (err) {
      // errors are shown inline below
      console.error("Sign in error:", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Choose your preferred sign in method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {search.error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {search.error === "unauthorized"
                ? "Please sign in to access this page"
                : search.error}
            </div>
          )}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <form.Field
              name="email"
              validators={{
                onChange: z
                  .string()
                  .email("Enter a valid email")
                  .min(1, "Email is required"),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    type="email"
                    placeholder="Enter your email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors?.length ? (
                    <div className="text-sm text-red-500">
                      {field.state.meta.errors[0]}
                    </div>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: z
                  .string()
                  .min(8, "Password must be at least 8 characters"),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="Enter your password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors?.length ? (
                    <div className="text-sm text-red-500">
                      {field.state.meta.errors[0]}
                    </div>
                  ) : null}
                </div>
              )}
            </form.Field>

            {form.state.submissionAttempts > 0 && form.state.errors?.length ? (
              <div className="text-sm text-red-500">{form.state.errors[0] as any}</div>
            ) : null}

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign in with Email"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SignInButton
              provider="discord"
              label="Discord"
              className="bg-[#5865F2] hover:bg-[#5865F2]/80"
            />
            <SignInButton
              provider="github"
              label="GitHub"
              className="bg-neutral-700 hover:bg-neutral-700/80"
            />
            <SignInButton
              provider="google"
              label="Google"
              className="bg-[#DB4437] hover:bg-[#DB4437]/80"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SignInButtonProps extends ComponentProps<typeof Button> {
  provider: "discord" | "google" | "github";
  label: string;
}

function SignInButton({ provider, label, className, ...props }: SignInButtonProps) {
  const router = useRouter();
  const handleOAuthSignIn = async () => {
    try {
      const { data, error } = await authClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${REDIRECT_URL}`,
        },
      });
      if (error) throw error;
      await router.invalidate();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("OAuth sign in error:", error);
    }
  };

  return (
    <Button
      onClick={handleOAuthSignIn}
      type="button"
      size="lg"
      className={cn("text-white hover:text-white", className)}
      {...props}
    >
      Sign in with {label}
    </Button>
  );
}
