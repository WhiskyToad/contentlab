import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "~/lib/components/ui/button";
import { useUpdateScriptMutation, useWorkspaceData } from "~/lib/queries/content";

export const Route = createFileRoute("/dashboard/filming")({
  component: FilmingPage,
});

function FilmingPage() {
  const workspaceQuery = useWorkspaceData();
  const { scripts = [] } = workspaceQuery.data ?? {};
  const queue = scripts.filter((script) => ["ready", "filmed", "posted"].includes(script.status));

  const updateStatusMutation = useUpdateScriptMutation();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Production</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Filming queue</h1>
      </div>
      {workspaceQuery.isLoading ? <LoadingState label="Loading filming queue..." /> : null}
      {workspaceQuery.error ? <ErrorState message={workspaceQuery.error.message} /> : null}

      <div className="grid gap-3">
        {queue.length ? (
          queue.map((script) => (
            <div key={script.id} className="grid gap-3 rounded-md border bg-card p-4 md:grid-cols-[1fr_auto]">
              <Link to="/dashboard/scripts/$scriptId" params={{ scriptId: script.id }} className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{script.title}</h3>
                  <Pill>{script.status}</Pill>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {script.hook || script.body || "Open this script to prep for recording."}
                </p>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate({ id: script.id, status: "filmed" })}
                >
                  Mark filmed
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate({ id: script.id, status: "posted" })}
                >
                  Mark posted
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border bg-card p-5 text-sm text-muted-foreground">
            No scripts are ready to film yet. Mark a script as ready from the script editor.
          </div>
        )}
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
