import { eq } from 'drizzle-orm'
import { getDb } from '~/lib/server/db/drizzle'
import { runEvents, runs } from '~/lib/server/db/schema'

export type RunStatus = 'running' | 'succeeded' | 'failed' | 'cancelled'
export type RunLevel = 'debug' | 'info' | 'warn' | 'error'

export async function createRun(input: {
  title: string
  source?: string
  workflow?: string
  meta?: Record<string, unknown>
}) {
  const db = getDb()

  const [row] = await db
    .insert(runs)
    .values({
      title: input.title,
      source: input.source ?? 'manual',
      workflow: input.workflow,
      meta: input.meta ?? {},
      status: 'running',
      ok: false,
    })
    .returning({ id: runs.id })

  return row
}

export async function appendRunEvent(input: {
  runId: string
  level?: RunLevel
  message: string
  data?: Record<string, unknown> | null
}) {
  const db = getDb()
  await db.insert(runEvents).values({
    runId: input.runId,
    level: input.level ?? 'info',
    message: input.message,
    data: input.data ?? null,
  })
}

export async function finishRun(input: { runId: string; status: RunStatus; ok: boolean }) {
  const db = getDb()
  await db
    .update(runs)
    .set({
      status: input.status,
      ok: input.ok,
    })
    .where(eq(runs.id, input.runId))
}
