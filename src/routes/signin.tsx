import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import authClient from "~/lib/auth-client";
import { Button } from "~/lib/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/lib/components/ui/card";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { AuthCredentialsSchema, signInFn } from "~/lib/server/auth-actions";
import { cn } from "~/lib/utils";

const REDIRECT_URL = "/dashboard";

export const Route = createFileRoute("/signin")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: search.error as string | undefined,
      redirect: search.redirect as string | undefined,
    };
  },
  beforeLoad: async ({ context, search }) => {
    if (context.user) {
      throw redirect({
        to: search.redirect || REDIRECT_URL,
      });
    }
  },
  component: SignInPage,
});

function SignInPage() {
  const search = Route.useSearch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");

    const validatedCredentials = AuthCredentialsSchema.safeParse({ email, password });
    if (!validatedCredentials.success) {
      setAuthError(validatedCredentials.error.errors[0]?.message ?? "Check your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signInFn({ data: validatedCredentials.data });

      if (result?.error) {
        setAuthError(result.message || "Authentication failed");
        return;
      }

      await router.invalidate();
      router.navigate({ to: search.redirect || REDIRECT_URL });
    } catch (error) {
      console.error("Sign in error:", error);
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      description="Continue to your ContentLab workspace."
      footer={
        <>
          New to ContentLab?{" "}
          <Link
            to="/signup"
            search={{ redirect: search.redirect || REDIRECT_URL }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {search.error ? (
        <Alert tone="error">
          {search.error === "unauthorized" ? "Please sign in to access this page" : search.error}
        </Alert>
      ) : null}
      {authError ? <Alert tone="error">{authError}</Alert> : null}

      <form onSubmit={handleSignIn} className="space-y-4">
        <EmailPasswordFields
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <ProviderDivider />
      <ProviderButtons redirectTo={REDIRECT_URL} />
    </AuthShell>
  );
}

export function AuthShell({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-[420px] rounded-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          <div className="text-center text-sm text-muted-foreground">{footer}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmailPasswordFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
        />
      </div>
    </>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-md p-3 text-sm",
        tone === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700",
      )}
    >
      {children}
    </div>
  );
}

export function ProviderDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>
    </div>
  );
}

interface ProviderButtonsProps {
  redirectTo: string;
}

export function ProviderButtons({ redirectTo }: ProviderButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      <ProviderButton
        provider="discord"
        label="Discord"
        redirectTo={redirectTo}
        className="bg-[#5865F2] hover:bg-[#5865F2]/80"
      />
      <ProviderButton
        provider="github"
        label="GitHub"
        redirectTo={redirectTo}
        className="bg-neutral-700 hover:bg-neutral-700/80"
      />
      <ProviderButton
        provider="google"
        label="Google"
        redirectTo={redirectTo}
        className="bg-[#DB4437] hover:bg-[#DB4437]/80"
      />
    </div>
  );
}

interface ProviderButtonProps extends ComponentProps<typeof Button> {
  provider: "discord" | "google" | "github";
  label: string;
  redirectTo: string;
}

function ProviderButton({ provider, label, redirectTo, className, ...props }: ProviderButtonProps) {
  const router = useRouter();
  const handleOAuthSignIn = async () => {
    try {
      const { data, error } = await authClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
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
      Continue with {label}
    </Button>
  );
}
