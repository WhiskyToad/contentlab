import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  AiHelperInputSchema,
  AiHelperResultSchema,
  CreateScriptSchema,
  CreateVideoSchema,
  ScriptReferenceSchema,
  ScriptSchema,
  UpdateScriptSchema,
  UpdateVideoSchema,
  VideoSchema,
  type AiHelperAction,
  type AiHelperResult,
} from '~/schema'
import { parseVideoUrl } from '~/lib/video-utils'
import type { TablesInsert, TablesUpdate } from '~/lib/database.types'

const VIDEOS_SELECT = '*'
const SCRIPTS_SELECT = '*'

async function getAuthenticatedSupabase() {
  const { getSupabaseServerClient } = await import('~/lib/server/auth')
  const supabase = getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  return { supabase, user }
}

function definedFields<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as Partial<T>
}

export const getWorkspaceData = createServerFn({ method: 'POST' }).handler(async () => {
  const { supabase, user } = await getAuthenticatedSupabase()

  const [videosResult, scriptsResult] = await Promise.all([
    supabase
      .from('videos')
      .select(VIDEOS_SELECT)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('scripts')
      .select(SCRIPTS_SELECT)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50),
  ])

  if (videosResult.error) throw videosResult.error
  if (scriptsResult.error) throw scriptsResult.error

  return {
    videos: VideoSchema.array().parse(videosResult.data),
    scripts: ScriptSchema.array().parse(scriptsResult.data),
  }
})

export const createVideoFromUrl = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => CreateVideoSchema.parse(data))
  .handler(async ({ data }) => {
    const input = data
    const { supabase, user } = await getAuthenticatedSupabase()
    const parsed = parseVideoUrl(input.url)
    const youtubeMetadata =
      parsed.platform === 'youtube' && parsed.externalId
        ? await import('~/lib/server/youtube').then(({ fetchYouTubeMetadata }) =>
            fetchYouTubeMetadata(parsed.externalId as string),
          )
        : {}
    const aiMetadata = await inferVideoMetadata(input.url, youtubeMetadata)

    const insertPayload: TablesInsert<'videos'> = {
      user_id: user.id,
      url: input.url,
      platform: parsed.platform,
      external_id: parsed.externalId,
      tags: aiMetadata.tags,
      niche: aiMetadata.niche,
      format: aiMetadata.format,
      notes: aiMetadata.notes,
      ...youtubeMetadata,
    }

    const { data: video, error } = await supabase
      .from('videos')
      .insert(insertPayload)
      .select(VIDEOS_SELECT)
      .single()

    if (error && error.code === '23505') {
      const { data: existingVideo, error: existingError } = await supabase
        .from('videos')
        .select(VIDEOS_SELECT)
        .eq('user_id', user.id)
        .eq('url', input.url)
        .single()

      if (existingError) throw existingError
      return VideoSchema.parse(existingVideo)
    }

    if (error) throw error
    return VideoSchema.parse(video)
  })

export const updateVideo = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => UpdateVideoSchema.parse(data))
  .handler(async ({ data }) => {
    const input = data
    const { supabase, user } = await getAuthenticatedSupabase()
    const { id, ...fields } = input

    const { data: video, error } = await supabase
      .from('videos')
      .update(definedFields(fields))
      .eq('id', id)
      .eq('user_id', user.id)
      .select(VIDEOS_SELECT)
      .single()

    if (error) throw error
    return VideoSchema.parse(video)
  })

export const getVideoDetail = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabase, user } = await getAuthenticatedSupabase()
    const { data: video, error } = await supabase
      .from('videos')
      .select(VIDEOS_SELECT)
      .eq('id', data.id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return VideoSchema.parse(video)
  })

export const createScript = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => CreateScriptSchema.parse(data))
  .handler(async ({ data }) => {
    const input = data
    const { supabase, user } = await getAuthenticatedSupabase()

    const { data: script, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        title: input.title,
        target_platform: 'youtube',
      })
      .select(SCRIPTS_SELECT)
      .single()

    if (error) throw error
    return ScriptSchema.parse(script)
  })

export const updateScript = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => UpdateScriptSchema.parse(data))
  .handler(async ({ data }) => {
    const input = data
    const { supabase, user } = await getAuthenticatedSupabase()
    const { id, reference_video_ids: referenceVideoIds, ...fields } = input

    if (referenceVideoIds) {
      const uniqueVideoIds = Array.from(new Set(referenceVideoIds))
      if (uniqueVideoIds.length > 5) {
        throw new Error('Scripts can link to at most 5 reference videos')
      }

      const { data: ownedVideos, error: ownedVideosError } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', user.id)
        .in('id', uniqueVideoIds)

      if (ownedVideosError) throw ownedVideosError
      if ((ownedVideos ?? []).length !== uniqueVideoIds.length) {
        throw new Error('One or more reference videos could not be found')
      }

      const { error: deleteError } = await supabase
        .from('script_references')
        .delete()
        .eq('script_id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      if (uniqueVideoIds.length) {
        const { error: insertError } = await supabase.from('script_references').insert(
          uniqueVideoIds.map((videoId) => ({
            script_id: id,
            video_id: videoId,
            user_id: user.id,
          })),
        )

        if (insertError) throw insertError
      }
    }

    const payload = definedFields(fields)
    const query = supabase
      .from('scripts')
      .select(SCRIPTS_SELECT)
      .eq('id', id)
      .eq('user_id', user.id)

    const { data: script, error } =
      Object.keys(payload).length === 0
        ? await query.single()
        : await supabase
            .from('scripts')
            .update(payload)
            .eq('id', id)
            .eq('user_id', user.id)
            .select(SCRIPTS_SELECT)
            .single()

    if (error) throw error
    return ScriptSchema.parse(script)
  })

export const getScriptDetail = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabase, user } = await getAuthenticatedSupabase()
    const [scriptResult, referencesResult, videosResult] = await Promise.all([
      supabase
        .from('scripts')
        .select(SCRIPTS_SELECT)
        .eq('id', data.id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('script_references')
        .select('*, videos(*)')
        .eq('script_id', data.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('videos')
        .select(VIDEOS_SELECT)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    if (scriptResult.error) throw scriptResult.error
    if (referencesResult.error) throw referencesResult.error
    if (videosResult.error) throw videosResult.error

    return {
      script: ScriptSchema.parse(scriptResult.data),
      references: ScriptReferenceSchema.array().parse(referencesResult.data),
      videos: VideoSchema.array().parse(videosResult.data),
    }
  })

function helperPrompt(action: AiHelperAction, input: string): string {
  const instructions: Record<AiHelperAction, string> = {
    clean_transcript:
      'Clean this raw transcript into a readable script. Remove filler, false starts, repeated words, and transcript artifacts. Preserve the speaker intent and phrasing.',
    summarise_structure:
      'Summarise the structure of this video script. Identify the hook, main beats, transitions, CTA, and why the flow works.',
    extract_hook: 'Extract the strongest hook from this script or transcript.',
    extract_cta: 'Extract the call to action from this script or transcript.',
    list_beats: 'List the story or argument beats in order. Keep each beat short and usable for planning.',
    rewrite_same_format:
      'Rewrite the rough script in the same structural format as the reference while making it original.',
    alternate_hooks: 'Generate five alternate hooks for this script idea.',
    make_shorter: 'Make this script shorter while preserving the core message and CTA.',
    make_casual: 'Rewrite this script to sound more casual and conversational.',
    make_punchy: 'Rewrite this script to be tighter, punchier, and more direct.',
  }

  return `${instructions[action]}\n\nInput:\n${input}`
}

async function inferVideoMetadata(
  url: string,
  metadata: Record<string, unknown>,
): Promise<{ niche: string | null; format: string | null; tags: string[]; notes: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      niche: null,
      format: null,
      tags: [],
      notes: '',
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
        input: `Infer useful script-library metadata for this saved video. Use the URL and any available metadata. Keep tags short and practical.\n\nURL: ${url}\n\nMetadata:\n${JSON.stringify(metadata)}`,
        text: {
          format: {
            type: 'json_schema',
            name: 'video_metadata',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                niche: { type: ['string', 'null'] },
                format: { type: ['string', 'null'] },
                tags: { type: 'array', items: { type: 'string' }, maxItems: 8 },
                notes: { type: 'string' },
              },
              required: ['niche', 'format', 'tags', 'notes'],
            },
          },
        },
      }),
    })

    if (!response.ok) {
      console.warn('Video metadata inference failed:', response.status, await response.text())
      return { niche: null, format: null, tags: [], notes: '' }
    }

    const payload = await response.json()
    const outputText =
      payload.output_text ??
      payload.output
        ?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
        .find((content: { type?: string; text?: string }) => content.type === 'output_text')?.text

    if (!outputText) return { niche: null, format: null, tags: [], notes: '' }

    const parsed = z
      .object({
        niche: z.string().nullable(),
        format: z.string().nullable(),
        tags: z.array(z.string()).max(8),
        notes: z.string(),
      })
      .parse(JSON.parse(outputText))

    return parsed
  } catch (error) {
    console.warn('Video metadata inference failed:', error)
    return { niche: null, format: null, tags: [], notes: '' }
  }
}

async function runOpenAiHelper(action: AiHelperAction, input: string): Promise<AiHelperResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
      input: helperPrompt(action, input),
      text: {
        format: {
          type: 'json_schema',
          name: 'script_helper_result',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              cleanScript: { type: 'string' },
              summary: { type: 'string' },
              hook: { type: 'string' },
              cta: { type: 'string' },
              beats: { type: 'array', items: { type: 'string' } },
              rewrites: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
            },
            required: ['title', 'cleanScript', 'summary', 'hook', 'cta', 'beats', 'rewrites', 'notes'],
          },
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI helper failed: ${response.status} ${await response.text()}`)
  }

  const payload = await response.json()
  const outputText =
    payload.output_text ??
    payload.output
      ?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
      .find((content: { type?: string; text?: string }) => content.type === 'output_text')?.text

  if (!outputText) {
    throw new Error('OpenAI helper returned no text output')
  }

  return AiHelperResultSchema.parse(JSON.parse(outputText))
}

export const runScriptHelper = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => AiHelperInputSchema.parse(data))
  .handler(async ({ data }) => {
    const input = data
    const { supabase, user } = await getAuthenticatedSupabase()

    try {
      const result = await runOpenAiHelper(input.action, input.input)

      if (input.entityType === 'video' && result.cleanScript) {
        await supabase
          .from('videos')
          .update({ clean_script: result.cleanScript })
          .eq('id', input.entityId)
          .eq('user_id', user.id)
      }

      if (input.entityType === 'script') {
        const scriptUpdate: TablesUpdate<'scripts'> = {}
        if (result.hook) scriptUpdate.hook = result.hook
        if (result.cta) scriptUpdate.cta = result.cta
        if (result.rewrites?.[0]) scriptUpdate.body = result.rewrites[0]
        if (result.notes || result.summary || result.beats?.length) {
          scriptUpdate.notes = [result.summary, ...(result.beats ?? []), result.notes]
            .filter(Boolean)
            .join('\n')
        }

        if (Object.keys(scriptUpdate).length) {
          await supabase
            .from('scripts')
            .update(scriptUpdate)
            .eq('id', input.entityId)
            .eq('user_id', user.id)
        }
      }

      await supabase.from('ai_generations').insert({
        user_id: user.id,
        entity_type: input.entityType,
        entity_id: input.entityId,
        action: input.action,
        status: 'succeeded',
        input: { text: input.input },
        output: result,
      })

      return result
    } catch (error) {
      await supabase.from('ai_generations').insert({
        user_id: user.id,
        entity_type: input.entityType,
        entity_id: input.entityId,
        action: input.action,
        status: 'failed',
        input: { text: input.input },
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  })
