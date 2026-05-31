import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  createScript,
  createVideoFromUrl,
  getScriptDetail,
  getVideoDetail,
  getWorkspaceData,
  runScriptHelper,
  updateScript,
  updateVideo,
} from '~/lib/server/content-actions'
import {
  AiHelperInputSchema,
  CreateScriptSchema,
  CreateVideoSchema,
  UpdateScriptSchema,
  UpdateVideoSchema,
} from '~/schema'

type CreateVideoInput = z.infer<typeof CreateVideoSchema>
type UpdateVideoInput = z.infer<typeof UpdateVideoSchema>
type CreateScriptInput = z.infer<typeof CreateScriptSchema>
type UpdateScriptInput = z.infer<typeof UpdateScriptSchema>
type ScriptHelperInput = z.infer<typeof AiHelperInputSchema>

type MutationHookOptions<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: Error, variables: TVariables) => void | Promise<void>
}

export const contentQueryKeys = {
  all: ['content'] as const,
  workspace: () => [...contentQueryKeys.all, 'workspace'] as const,
  videos: () => [...contentQueryKeys.all, 'videos'] as const,
  video: (id: string) => [...contentQueryKeys.videos(), id] as const,
  scripts: () => [...contentQueryKeys.all, 'scripts'] as const,
  script: (id: string) => [...contentQueryKeys.scripts(), id] as const,
}

export function useWorkspaceData() {
  return useQuery({
    queryKey: contentQueryKeys.workspace(),
    queryFn: () => getWorkspaceData(),
  })
}

export function useVideoDetail(videoId: string) {
  return useQuery({
    queryKey: contentQueryKeys.video(videoId),
    queryFn: () => getVideoDetail({ data: { id: videoId } }),
    enabled: Boolean(videoId),
  })
}

export function useScriptDetail(scriptId: string) {
  return useQuery({
    queryKey: contentQueryKeys.script(scriptId),
    queryFn: () => getScriptDetail({ data: { id: scriptId } }),
    enabled: Boolean(scriptId),
  })
}

export function useCreateVideoMutation(
  options?: MutationHookOptions<Awaited<ReturnType<typeof createVideoFromUrl>>, CreateVideoInput>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateVideoInput) => createVideoFromUrl({ data }),
    onSuccess: async (video, variables) => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.workspace() })
      await options?.onSuccess?.(video, variables)
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables)
    },
  })
}

export function useUpdateVideoMutation(
  options?: MutationHookOptions<Awaited<ReturnType<typeof updateVideo>>, UpdateVideoInput>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateVideoInput) => updateVideo({ data }),
    onSuccess: async (video, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contentQueryKeys.video(variables.id) }),
        queryClient.invalidateQueries({ queryKey: contentQueryKeys.workspace() }),
      ])
      await options?.onSuccess?.(video, variables)
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables)
    },
  })
}

export function useCreateScriptMutation(
  options?: MutationHookOptions<Awaited<ReturnType<typeof createScript>>, CreateScriptInput>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateScriptInput) => createScript({ data }),
    onSuccess: async (script, variables) => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.workspace() })
      await options?.onSuccess?.(script, variables)
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables)
    },
  })
}

export function useUpdateScriptMutation(
  options?: MutationHookOptions<Awaited<ReturnType<typeof updateScript>>, UpdateScriptInput>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateScriptInput) => updateScript({ data }),
    onSuccess: async (script, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contentQueryKeys.script(variables.id) }),
        queryClient.invalidateQueries({ queryKey: contentQueryKeys.workspace() }),
      ])
      await options?.onSuccess?.(script, variables)
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables)
    },
  })
}

export function useScriptHelperMutation(
  options?: MutationHookOptions<Awaited<ReturnType<typeof runScriptHelper>>, ScriptHelperInput>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ScriptHelperInput) => runScriptHelper({ data }),
    onSuccess: async (result, variables) => {
      await Promise.all([
        variables.entityType === 'video'
          ? queryClient.invalidateQueries({ queryKey: contentQueryKeys.video(variables.entityId) })
          : queryClient.invalidateQueries({ queryKey: contentQueryKeys.script(variables.entityId) }),
        queryClient.invalidateQueries({ queryKey: contentQueryKeys.workspace() }),
      ])
      await options?.onSuccess?.(result, variables)
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables)
    },
  })
}
