import { Link, createFileRoute } from "@tanstack/react-router";
import { useWorkspaceData } from "~/lib/queries/content";

export const Route = createFileRoute("/dashboard/research")({
  component: ResearchPage,
});

function ResearchPage() {
  const workspaceQuery = useWorkspaceData();
  const { videos = [] } = workspaceQuery.data ?? {};
  const tagCounts = countValues(videos.flatMap((video) => video.tags));
  const nicheCounts = countValues(videos.map((video) => video.niche).filter(Boolean) as string[]);
  const needsTranscript = videos.filter((video) => !video.raw_transcript && !video.clean_script);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Research overview</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Patterns and gaps</h1>
      </div>
      {workspaceQuery.isLoading ? <LoadingState label="Loading research..." /> : null}
      {workspaceQuery.error ? <ErrorState message={workspaceQuery.error.message} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsPanel title="Top tags" items={tagCounts} empty="No tags inferred yet." />
        <StatsPanel title="Top niches" items={nicheCounts} empty="No niches inferred yet." />
      </div>

      <section className="rounded-md border bg-card p-5">
        <h2 className="text-lg font-semibold">Needs transcript</h2>
        <div className="mt-4 grid gap-3">
          {needsTranscript.length ? (
            needsTranscript.slice(0, 8).map((video) => (
              <Link
                key={video.id}
                to="/dashboard/videos/$videoId"
                params={{ videoId: video.id }}
                className="rounded-md border p-3 text-sm hover:bg-accent"
              >
                <span className="font-medium">{video.title || "Untitled reference"}</span>
                <span className="ml-2 text-muted-foreground">{video.platform}</span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Every saved reference has transcript or script text.</p>
          )}
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

function countValues(values: string[]) {
  return Object.entries(
    values.reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

function StatsPanel({ title, items, empty }: { title: string; items: Array<[string, number]>; empty: string }) {
  return (
    <section className="rounded-md border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{label}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </div>
    </section>
  );
}
