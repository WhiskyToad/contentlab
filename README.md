# ContentLab

An authenticated video script research and writing workspace.

ContentLab lets you save videos you like, capture transcripts, clean them into readable reference scripts, tag what worked, and draft your own scripts linked to inspiration videos.

## MVP Workflow

1. Paste a YouTube, TikTok, or Instagram video URL.
2. Save metadata, tags, notes, and transcript text.
3. Clean the transcript into a readable script.
4. Store it in a searchable reference library.
5. Draft your own script with hook, body, CTA, notes, status, and linked references.

## Stack

- React 19
- TanStack Start, Router, and Query
- Supabase Auth and Database
- Tailwind CSS v4
- shadcn/ui-style local primitives

## Environment

Create a `.env` file with:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YOUTUBE_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

`SUPABASE_SERVICE_ROLE_KEY` is only needed for server-admin Supabase operations.

`YOUTUBE_API_KEY` is optional. When present, YouTube URLs auto-fill official metadata from the YouTube Data API. TikTok and Instagram are manual-first in this MVP.

`OPENAI_API_KEY` is required for the script helper actions.

## Development

Install dependencies, apply Supabase migrations, then run:

```bash
npm run dev
```

Build:

```bash
npm run build
```
