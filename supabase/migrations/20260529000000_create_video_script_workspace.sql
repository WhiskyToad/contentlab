CREATE TABLE public.videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  url text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'other')),
  external_id text,
  creator text,
  thumbnail_url text,
  title text,
  caption text,
  published_at timestamp with time zone,
  tags text[] NOT NULL DEFAULT '{}',
  niche text,
  format text,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'used', 'archived')),
  raw_transcript text NOT NULL DEFAULT '',
  clean_script text NOT NULL DEFAULT '',
  transcript_segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, url)
);

CREATE TABLE public.scripts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  hook text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  target_platform text NOT NULL DEFAULT 'youtube' CHECK (target_platform IN ('youtube', 'tiktok', 'instagram', 'other')),
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'ready', 'filmed', 'posted')),
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.script_references (
  script_id uuid NOT NULL REFERENCES public.scripts (id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (script_id, video_id)
);

CREATE TABLE public.ai_generations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('video', 'script')),
  entity_id uuid NOT NULL,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'failed')),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX videos_user_created_at_idx ON public.videos (user_id, created_at DESC);
CREATE INDEX videos_user_platform_idx ON public.videos (user_id, platform);
CREATE INDEX videos_user_status_idx ON public.videos (user_id, status);
CREATE INDEX scripts_user_updated_at_idx ON public.scripts (user_id, updated_at DESC);
CREATE INDEX scripts_user_status_idx ON public.scripts (user_id, status);
CREATE INDEX script_references_user_script_idx ON public.script_references (user_id, script_id);
CREATE INDEX ai_generations_user_entity_idx ON public.ai_generations (user_id, entity_type, entity_id);

CREATE OR REPLACE FUNCTION public.update_content_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_content_workspace_updated_at();

CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_content_workspace_updated_at();

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own scripts"
  ON public.scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scripts"
  ON public.scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
  ON public.scripts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
  ON public.scripts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own script references"
  ON public.script_references FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own script references"
  ON public.script_references FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own script references"
  ON public.script_references FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own script references"
  ON public.script_references FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI generations"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
