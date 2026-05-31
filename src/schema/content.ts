import { z } from 'zod'

export const VideoPlatformSchema = z.enum(['youtube', 'tiktok', 'instagram', 'other'])
export const VideoStatusSchema = z.enum(['saved', 'used', 'archived'])
export const ScriptStatusSchema = z.enum(['idea', 'draft', 'ready', 'filmed', 'posted'])
export const AiHelperActionSchema = z.enum([
  'clean_transcript',
  'summarise_structure',
  'extract_hook',
  'extract_cta',
  'list_beats',
  'rewrite_same_format',
  'alternate_hooks',
  'make_shorter',
  'make_casual',
  'make_punchy',
])

const TextArraySchema = z.array(z.string()).default([])

export const TranscriptSegmentSchema = z.object({
  start: z.number().nullable().optional(),
  end: z.number().nullable().optional(),
  text: z.string(),
})

export const VideoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  url: z.string().url(),
  platform: VideoPlatformSchema,
  external_id: z.string().nullable(),
  creator: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  title: z.string().nullable(),
  caption: z.string().nullable(),
  published_at: z.string().nullable(),
  tags: TextArraySchema,
  niche: z.string().nullable(),
  format: z.string().nullable(),
  notes: z.string(),
  status: VideoStatusSchema,
  raw_transcript: z.string(),
  clean_script: z.string(),
  transcript_segments: z.array(TranscriptSegmentSchema),
  view_count: z.number().nullable(),
  like_count: z.number().nullable(),
  comment_count: z.number().nullable(),
  duration_seconds: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ScriptSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  hook: z.string(),
  body: z.string(),
  cta: z.string(),
  notes: z.string(),
  target_platform: VideoPlatformSchema,
  status: ScriptStatusSchema,
  tags: TextArraySchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export const ScriptReferenceSchema = z.object({
  script_id: z.string().uuid(),
  video_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  videos: VideoSchema.optional(),
})

export const CreateVideoSchema = z.object({
  url: z.string().url('Paste a valid video URL'),
})

export const UpdateVideoSchema = z.object({
  id: z.string().uuid(),
  creator: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  tags: TextArraySchema.optional(),
  niche: z.string().nullable().optional(),
  format: z.string().nullable().optional(),
  notes: z.string().optional(),
  status: VideoStatusSchema.optional(),
  raw_transcript: z.string().optional(),
  clean_script: z.string().optional(),
  transcript_segments: z.array(TranscriptSegmentSchema).optional(),
  view_count: z.number().nullable().optional(),
  like_count: z.number().nullable().optional(),
  comment_count: z.number().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
})

export const CreateScriptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

export const UpdateScriptSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  hook: z.string().optional(),
  body: z.string().optional(),
  cta: z.string().optional(),
  notes: z.string().optional(),
  target_platform: VideoPlatformSchema.optional(),
  status: ScriptStatusSchema.optional(),
  tags: TextArraySchema.optional(),
  reference_video_ids: z.array(z.string().uuid()).max(5).optional(),
})

export const AiHelperInputSchema = z.object({
  entityType: z.enum(['video', 'script']),
  entityId: z.string().uuid(),
  action: AiHelperActionSchema,
  input: z.string().min(1),
})

export const AiHelperResultSchema = z.object({
  title: z.string().optional(),
  cleanScript: z.string().optional(),
  summary: z.string().optional(),
  hook: z.string().optional(),
  cta: z.string().optional(),
  beats: z.array(z.string()).optional(),
  rewrites: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export type VideoPlatform = z.infer<typeof VideoPlatformSchema>
export type VideoStatus = z.infer<typeof VideoStatusSchema>
export type ScriptStatus = z.infer<typeof ScriptStatusSchema>
export type AiHelperAction = z.infer<typeof AiHelperActionSchema>
export type Video = z.infer<typeof VideoSchema>
export type Script = z.infer<typeof ScriptSchema>
export type ScriptReference = z.infer<typeof ScriptReferenceSchema>
export type AiHelperResult = z.infer<typeof AiHelperResultSchema>
