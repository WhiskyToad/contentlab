import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/lib/components/ui/button";
import { AuthCredentialsSchema, signUpFn } from "~/lib/server/auth-actions";
import {
  Alert,
  AuthShell,
  EmailPasswordFields,
  ProviderButtons,
  ProviderDivider,
} from "./signin";

const REDIRECT_URL = "/dashboard";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
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
  component: SignUpPage,
});

function SignUpPage() {
  const search = Route.useSearch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    const validatedCredentials = AuthCredentialsSchema.safeParse({ email, password });
    if (!validatedCredentials.success) {
      setAuthError(validatedCredentials.error.errors[0]?.message ?? "Check your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signUpFn({ data: validatedCredentials.data });

      if (result?.error) {
        setAuthError(result.message || "Could not create account");
        return;
      }

      if (result?.needsConfirmation) {
        setAuthMessage("Check your email to confirm your account, then sign in.");
        return;
      }

      await router.invalidate();
      router.navigate({ to: search.redirect || REDIRECT_URL });
    } catch (error) {
      console.error("Sign up error:", error);
      setAuthError(error instanceof Error ? error.message : "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      description="Start saving reference videos and writing scripts."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/signin"
            search={{ error: "", redirect: search.redirect || REDIRECT_URL }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {authError ? <Alert tone="error">{authError}</Alert> : null}
      {authMessage ? <Alert tone="success">{authMessage}</Alert> : null}

      <form onSubmit={handleSignUp} className="space-y-4">
        <EmailPasswordFields
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || Boolean(authMessage)}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <ProviderDivider />
      <ProviderButtons redirectTo={REDIRECT_URL} />
    </AuthShell>
  );
}
