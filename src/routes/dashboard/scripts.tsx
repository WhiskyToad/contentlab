import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { useCreateScriptMutation, useWorkspaceData } from "~/lib/queries/content";
import type { ScriptStatus } from "~/schema";

export const Route = createFileRoute("/dashboard/scripts")({
  component: ScriptsPage,
});

function ScriptsPage() {
  const workspaceQuery = useWorkspaceData();
  const { scripts = [] } = workspaceQuery.data ?? {};
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ScriptStatus>("all");

  const createScriptMutation = useCreateScriptMutation({
    onSuccess: (script) => {
      setTitle("");
      router.navigate({ to: "/dashboard/scripts/$scriptId", params: { scriptId: script.id } });
    },
  });

  const filteredScripts = useMemo(
    () => scripts.filter((script) => statusFilter === "all" || script.status === statusFilter),
    [scripts, statusFilter],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await createScriptMutation.mutateAsync({ title });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Writing desk</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your scripts</h1>
      </div>

      <section className="rounded-md border bg-card p-5">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="script-title">Working idea</Label>
            <Input
              id="script-title"
              placeholder="Why most founder demos fail"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={createScriptMutation.isPending}>
              {createScriptMutation.isPending ? "Creating" : "Create draft"}
            </Button>
          </div>
        </form>
      </section>

      <div className="flex justify-end">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | ScriptStatus)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="idea">Idea</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="filmed">Filmed</option>
          <option value="posted">Posted</option>
        </select>
      </div>
      {workspaceQuery.isLoading ? <LoadingState label="Loading scripts..." /> : null}
      {workspaceQuery.error ? <ErrorState message={workspaceQuery.error.message} /> : null}

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
            <span className="text-sm text-muted-foreground">{new Date(script.updated_at).toLocaleDateString()}</span>
          </Link>
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
