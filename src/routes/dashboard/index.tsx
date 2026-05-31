import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Plus, Search, Sparkles, Video } from "lucide-react";
import { Button } from "~/lib/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/lib/components/ui/card";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { useCreateScriptMutation, useCreateVideoMutation, useWorkspaceData } from "~/lib/queries/content";
import { formatDuration } from "~/lib/video-utils";
import type { ScriptStatus, VideoPlatform, VideoStatus } from "~/schema";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const workspaceQuery = useWorkspaceData();
  const { videos = [], scripts = [] } = workspaceQuery.data ?? {};
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | VideoPlatform>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | VideoStatus>("all");
  const [scriptStatusFilter, setScriptStatusFilter] = useState<"all" | ScriptStatus>("all");
  const [query, setQuery] = useState("");

  const createVideoMutation = useCreateVideoMutation({
    onSuccess: () => {
      setVideoUrl("");
    },
  });

  const createScriptMutation = useCreateScriptMutation({
    onSuccess: (script) => {
      setScriptTitle("");
      router.navigate({ to: "/dashboard/scripts/$scriptId", params: { scriptId: script.id } });
    },
  });

  const filteredVideos = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesPlatform = platformFilter === "all" || video.platform === platformFilter;
      const matchesStatus = statusFilter === "all" || video.status === statusFilter;
      const searchable = [video.title, video.creator, video.niche, video.format, video.tags.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalisedQuery || searchable.includes(normalisedQuery);
      return matchesPlatform && matchesStatus && matchesQuery;
    });
  }, [platformFilter, query, statusFilter, videos]);

  const filteredScripts = useMemo(() => {
    return scripts.filter((script) => scriptStatusFilter === "all" || script.status === scriptStatusFilter);
  }, [scriptStatusFilter, scripts]);

  const readyScripts = scripts.filter((script) => script.status === "ready").length;
  const usableReferences = videos.filter((video) => video.clean_script || video.raw_transcript).length;

  const handleCreateVideo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!videoUrl.trim()) return;
    await createVideoMutation.mutateAsync({ url: videoUrl });
  };

  const handleCreateScript = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scriptTitle.trim()) return;
    await createScriptMutation.mutateAsync({ title: scriptTitle });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Workspace dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Research to script pipeline</h1>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm md:w-[420px]">
          <Metric label="References" value={videos.length} />
          <Metric label="Drafts" value={scripts.length} />
          <Metric label="Ready" value={readyScripts} />
        </div>
      </div>
      {workspaceQuery.isLoading ? <LoadingState label="Loading workspace..." /> : null}
      {workspaceQuery.error ? <ErrorState message={workspaceQuery.error.message} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="rounded-md border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Video className="size-5" />
            <h2 className="text-lg font-semibold">Add a video</h2>
          </div>
          <form onSubmit={handleCreateVideo} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="video-url">URL</Label>
              <Input
                id="video-url"
                placeholder="Paste a YouTube, TikTok, or Instagram URL"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createVideoMutation.isPending}>
                <Plus />
                {createVideoMutation.isPending ? "Analysing" : "Save video"}
              </Button>
            </div>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            ContentLab will infer niche, format, and tags from available video metadata.
          </p>
          {createVideoMutation.error ? (
            <p className="mt-3 text-sm text-destructive">{createVideoMutation.error.message}</p>
          ) : null}
        </section>

        <section className="rounded-md border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="size-5" />
            <h2 className="text-lg font-semibold">Start a script</h2>
          </div>
          <form onSubmit={handleCreateScript} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="script-title">Working idea</Label>
              <Input
                id="script-title"
                placeholder="Why most founder demos fail"
                value={scriptTitle}
                onChange={(event) => setScriptTitle(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={createScriptMutation.isPending} className="w-full">
              <Sparkles />
              {createScriptMutation.isPending ? "Creating" : "Create draft"}
            </Button>
          </form>
        </section>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <PipelineCard label="Capture" value={videos.length} detail="Saved references" />
        <PipelineCard label="Study" value={usableReferences} detail="With transcript or clean script" />
        <PipelineCard label="Write" value={scripts.length} detail="Own scripts in progress" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Script library</h2>
            <p className="text-sm text-muted-foreground">{usableReferences} references have transcript or script text.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search references"
                className="w-[220px] pl-9"
              />
            </div>
            <FilterSelect value={platformFilter} onChange={(value) => setPlatformFilter(value as "all" | VideoPlatform)}>
              <option value="all">All platforms</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="other">Other</option>
            </FilterSelect>
            <FilterSelect value={statusFilter} onChange={(value) => setStatusFilter(value as "all" | VideoStatus)}>
              <option value="all">All statuses</option>
              <option value="saved">Saved</option>
              <option value="used">Used</option>
              <option value="archived">Archived</option>
            </FilterSelect>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden rounded-md py-0">
              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
                  No thumbnail
                </div>
              )}
              <CardHeader className="px-4 pt-4">
                <CardTitle className="line-clamp-2 text-base leading-snug">
                  {video.title || "Untitled reference"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Pill>{video.platform}</Pill>
                  <Pill>{video.status}</Pill>
                  <Pill>{formatDuration(video.duration_seconds)}</Pill>
                  {video.niche ? <Pill>{video.niche}</Pill> : null}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {video.creator || video.caption || "Add notes and transcript details."}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/dashboard/videos/$videoId" params={{ videoId: video.id }}>Open reference</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">Your scripts</h2>
          <FilterSelect value={scriptStatusFilter} onChange={(value) => setScriptStatusFilter(value as "all" | ScriptStatus)}>
            <option value="all">All statuses</option>
            <option value="idea">Idea</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="filmed">Filmed</option>
            <option value="posted">Posted</option>
          </FilterSelect>
        </div>
        <div className="grid gap-3">
          {filteredScripts.map((script) => (
            <Link
              key={script.id}
              to="/dashboard/scripts/$scriptId"
              params={{ scriptId: script.id }}
              className="grid gap-3 rounded-md border bg-card p-4 transition-colors hover:bg-accent md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{script.title}</h3>
                  <Pill>{script.status}</Pill>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {script.hook || script.body || "Open this draft to write the hook, body, CTA, and link references."}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(script.updated_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">{label}</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-md border border-destructive/30 bg-card p-4 text-sm text-destructive">{message}</div>;
}

function PipelineCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
      {children}
    </span>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-md border bg-background px-3 text-sm"
    >
      {children}
    </select>
  );
}
