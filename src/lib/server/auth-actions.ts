import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const REDIRECT_URL = "/dashboard";

export const AuthCredentialsSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export interface AuthResult {
  error?: boolean;
  message?: string;
  success?: boolean;
  needsConfirmation?: boolean;
}

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AuthCredentialsSchema.parse(data))
  .handler(async ({ data }) => {
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
      } as AuthResult;
    }

    return { success: true } as AuthResult;
  });

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AuthCredentialsSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSupabaseServerClient } = await import("~/lib/server/auth");
    const supabase = getSupabaseServerClient();
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.VITE_BASE_URL ?? "http://localhost:3000"}${REDIRECT_URL}`,
      },
    });

    if (error) {
      return {
        error: true,
        message: error.message,
      } as AuthResult;
    }

    return {
      success: true,
      needsConfirmation: !authData.session,
    } as AuthResult;
  });
