import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "~/lib/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/lib/components/ui/card";
import { Input } from "~/lib/components/ui/input";
import { useWorkspaceData } from "~/lib/queries/content";
import { formatDuration } from "~/lib/video-utils";
import type { VideoPlatform, VideoStatus } from "~/schema";

export const Route = createFileRoute("/dashboard/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const workspaceQuery = useWorkspaceData();
  const { videos = [] } = workspaceQuery.data ?? {};
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | VideoPlatform>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | VideoStatus>("all");

  const filteredVideos = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesPlatform = platformFilter === "all" || video.platform === platformFilter;
      const matchesStatus = statusFilter === "all" || video.status === statusFilter;
      const searchable = [video.title, video.creator, video.niche, video.format, video.tags.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesPlatform && matchesStatus && (!normalisedQuery || searchable.includes(normalisedQuery));
    });
  }, [platformFilter, query, statusFilter, videos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Reference library</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Saved videos</h1>
        </div>
        <Button asChild>
          <Link to="/dashboard/add-video">Add video</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search references"
            className="w-[260px] pl-9"
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
      {workspaceQuery.isLoading ? <LoadingState label="Loading library..." /> : null}
      {workspaceQuery.error ? <ErrorState message={workspaceQuery.error.message} /> : null}

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
                {video.creator || video.caption || "Open this reference to add transcript and notes."}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/dashboard/videos/$videoId" params={{ videoId: video.id }}>Open reference</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">{label}</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-md border border-destructive/30 bg-card p-4 text-sm text-destructive">{message}</div>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{children}</span>;
}

function FilterSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
      {children}
    </select>
  );
}
