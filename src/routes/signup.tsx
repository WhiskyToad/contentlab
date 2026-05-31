import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/lib/components/ui/button";
import { AuthCredentialsSchema, useSignUpMutation } from "~/lib/queries/auth";
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

  const signUpMutation = useSignUpMutation({
    onSuccess: async (result) => {
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
    },
    onError: (error) => {
      console.error("Sign up error:", error);
      setAuthError(error.message || "Could not create account");
    },
  });

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    const validatedCredentials = AuthCredentialsSchema.safeParse({ email, password });
    if (!validatedCredentials.success) {
      setAuthError(validatedCredentials.error.errors[0]?.message ?? "Check your email and password.");
      return;
    }

    await signUpMutation.mutateAsync(validatedCredentials.data);
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
        <Button type="submit" className="w-full" disabled={signUpMutation.isPending || Boolean(authMessage)}>
          {signUpMutation.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <ProviderDivider />
      <ProviderButtons redirectTo={REDIRECT_URL} />
    </AuthShell>
  );
}
