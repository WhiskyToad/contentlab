import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// Minimal "Run log" schema for the Agent OS

export const runs = pgTable(
  'runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    // Where did it come from?
    source: text('source').notNull().default('manual'), // manual|cron|webhook|ui
    workflow: text('workflow'),

    // Human-friendly
    title: text('title').notNull(),

    // Status
    status: text('status').notNull().default('running'), // running|succeeded|failed|cancelled
    ok: boolean('ok').notNull().default(false),

    // Optional payload for debugging
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
  },
  (t) => ({
    statusIdx: index('runs_status_idx').on(t.status),
    createdAtIdx: index('runs_created_at_idx').on(t.createdAt),
  }),
)

export const runEvents = pgTable(
  'run_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    level: text('level').notNull().default('info'), // debug|info|warn|error
    message: text('message').notNull(),
    data: jsonb('data').$type<Record<string, unknown> | null>().default(null),
  },
  (t) => ({
    runIdIdx: index('run_events_run_id_idx').on(t.runId),
    createdAtIdx: index('run_events_created_at_idx').on(t.createdAt),
  }),
)
