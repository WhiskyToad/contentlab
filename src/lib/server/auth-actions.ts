import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const REDIRECT_URL = "/dashboard";

type SerializableValue = string | number | boolean | null | SerializableValue[] | { [key: string]: SerializableValue };

export interface UserData {
  id: string;
  email?: string;
  user_metadata: { [key: string]: SerializableValue };
  app_metadata: { [key: string]: SerializableValue };
}

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

function serialiseUser(user: {
  id: string;
  email?: string;
  user_metadata: unknown;
  app_metadata: unknown;
}): UserData {
  const { id, email, user_metadata, app_metadata } = user;
  return {
    id,
    email,
    user_metadata: toSerializableMetadata(user_metadata),
    app_metadata: toSerializableMetadata(app_metadata),
  };
}

function toSerializableMetadata(value: unknown): { [key: string]: SerializableValue } {
  return JSON.parse(JSON.stringify(value ?? {})) as { [key: string]: SerializableValue };
}

export const getUserFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getSupabaseServerClient } = await import("~/lib/server/auth");
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.warn("Auth error:", error);
    return null;
  }

  return user ? serialiseUser(user) : null;
});

export const checkDashboardAuthFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { getSupabaseServerClient } = await import("~/lib/server/auth");
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: serialiseUser(user),
    };
  } catch (error) {
    console.error(error);
    return { authenticated: false, user: null };
  }
});

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

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getSupabaseServerClient } = await import("~/lib/server/auth");
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out error:", error);
    return {
      error: true,
      message: error.message,
    } as AuthResult;
  }

  return { success: true } as AuthResult;
});
