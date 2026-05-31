import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import authClient from '~/lib/auth-client'
import {
  AuthCredentialsSchema,
  checkDashboardAuthFn,
  getUserFn,
  signInFn,
  signOutFn,
  signUpFn,
} from '~/lib/server/auth-actions'
import type { UserData } from '~/lib/server/auth-actions'

export { AuthCredentialsSchema }
export type { UserData }

export const authQueryKeys = {
  all: ['auth'] as const,
  user: () => [...authQueryKeys.all, 'user'] as const,
  dashboard: () => [...authQueryKeys.all, 'dashboard'] as const,
}

export const authQueryOptions = {
  user: () =>
    queryOptions({
      queryKey: authQueryKeys.user(),
      queryFn: ({ signal }) => getUserFn({ signal }),
      staleTime: 0,
    }),
  dashboard: () =>
    queryOptions({
      queryKey: authQueryKeys.dashboard(),
      queryFn: () => checkDashboardAuthFn(),
      staleTime: 0,
    }),
}

type AuthCredentialsInput = z.infer<typeof AuthCredentialsSchema>
type AuthMutationOptions<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: Error, variables: TVariables) => void | Promise<void>
}

type OAuthSignInInput = {
  provider: 'discord' | 'google' | 'github'
  redirectTo: string
}

export function useCurrentUser() {
  return useQuery(authQueryOptions.user())
}

export function useSignInMutation(
  options?: AuthMutationOptions<Awaited<ReturnType<typeof signInFn>>, AuthCredentialsInput>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AuthCredentialsInput) => signInFn({ data }),
    onSuccess: async (result, variables) => {
      if (!result?.error) {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.all })
      }
      await options?.onSuccess?.(result, variables)
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables)
    },
  })
}

export function useSignUpMutation(
  options?: AuthMutationOptions<Awaited<ReturnType<typeof signUpFn>>, AuthCredentialsInput>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AuthCredentialsInput) => signUpFn({ data }),
    onSuccess: async (result, variables) => {
      if (!result?.error && !result?.needsConfirmation) {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.all })
      }
      await options?.onSuccess?.(result, variables)
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables)
    },
  })
}

export function useSignOutMutation(options?: AuthMutationOptions<Awaited<ReturnType<typeof signOutFn>>, void>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => signOutFn(),
    onSuccess: async (result) => {
      if (!result?.error) {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.all })
      }
      await options?.onSuccess?.(result, undefined)
    },
    onError: async (error) => {
      await options?.onError?.(error, undefined)
    },
  })
}

export function useOAuthSignInMutation(options?: AuthMutationOptions<{ url: string | null }, OAuthSignInInput>) {
  return useMutation({
    mutationFn: async ({ provider, redirectTo }: OAuthSignInInput) => {
      const { data, error } = await authClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
        },
      })

      if (error) throw error
      return { url: data.url }
    },
    onSuccess: async (result, variables) => {
      await options?.onSuccess?.(result, variables)
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables)
    },
  })
}
