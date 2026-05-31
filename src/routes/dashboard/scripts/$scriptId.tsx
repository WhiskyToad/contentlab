import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { getScriptDetail, runScriptHelper, updateScript } from "~/lib/server/content-actions";
import { parseTags } from "~/lib/video-utils";
import type { AiHelperAction, ScriptStatus } from "~/schema";

export const Route = createFileRoute("/dashboard/scripts/$scriptId")({
  loader: ({ params }) => getScriptDetail({ data: { id: params.scriptId } }),
  component: ScriptDetail,
});

function ScriptDetail() {
  const { script, references, videos } = Route.useLoaderData();
  const router = useRouter();
  const [title, setTitle] = useState(script.title);
  const [hook, setHook] = useState(script.hook);
  const [body, setBody] = useState(script.body);
  const [cta, setCta] = useState(script.cta);
  const [notes, setNotes] = useState(script.notes);
  const [tags, setTags] = useState(script.tags.join(", "));
  const [status, setStatus] = useState<ScriptStatus>(script.status);
  const [referenceIds, setReferenceIds] = useState(references.map((reference) => reference.video_id));
  const [helperAction, setHelperAction] = useState<AiHelperAction>("alternate_hooks");
  const [helperResult, setHelperResult] = useState("");

  const saveMutation = useMutation({
    mutationFn: () =>
      updateScript({
        data: {
          id: script.id,
          title,
          hook,
          body,
          cta,
          notes,
          status,
          tags: parseTags(tags),
          reference_video_ids: referenceIds,
        },
      }),
    onSuccess: async () => {
      await router.invalidate();
    },
  });

  const helperMutation = useMutation({
    mutationFn: () =>
      runScriptHelper({
        data: {
          entityType: "script",
          entityId: script.id,
          action: helperAction,
          input: [title, hook, body, cta, notes].filter(Boolean).join("\n\n"),
        },
      }),
    onSuccess: async (result) => {
      const rendered = renderHelperResult(result);
      setHelperResult(rendered);
      if (result.hook) setHook(result.hook);
      if (result.cta) setCta(result.cta);
      if (result.rewrites?.[0]) setBody(result.rewrites[0]);
      if (result.summary || result.beats?.length || result.notes) {
        setNotes([result.summary, ...(result.beats ?? []), result.notes].filter(Boolean).join("\n"));
      }
      await router.invalidate();
    },
  });

  const toggleReference = (videoId: string) => {
    setReferenceIds((current) => {
      if (current.includes(videoId)) return current.filter((id) => id !== videoId);
      if (current.length >= 5) return current;
      return [...current, videoId];
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveMutation.mutateAsync();
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Script draft</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Pill>{status}</Pill>
            <Pill>{referenceIds.length}/5 references</Pill>
          </div>
        </div>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving" : "Save script"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5 rounded-md border bg-card p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_160px]">
            <Field label="Title" value={title} onChange={setTitle} />
            <div className="space-y-2">
              <Label htmlFor="script-status">Status</Label>
              <select
                id="script-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as ScriptStatus)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="idea">Idea</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="filmed">Filmed</option>
                <option value="posted">Posted</option>
              </select>
            </div>
          </div>

          <Field label="Tags" value={tags} onChange={setTags} placeholder="pain point, tutorial" />
          <ScriptField label="Hook" value={hook} onChange={setHook} rows={4} />
          <ScriptField label="Body" value={body} onChange={setBody} rows={16} />
          <ScriptField label="CTA" value={cta} onChange={setCta} rows={4} />
          <ScriptField label="Notes" value={notes} onChange={setNotes} rows={8} />
        </section>

        <aside className="space-y-5">
          <section className="rounded-md border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Script helper</h2>
              <Button type="button" onClick={() => helperMutation.mutate()} disabled={helperMutation.isPending}>
                <Wand2 />
                {helperMutation.isPending ? "Working" : "Run"}
              </Button>
            </div>
            <select
              value={helperAction}
              onChange={(event) => setHelperAction(event.target.value as AiHelperAction)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="alternate_hooks">Generate 5 alternate hooks</option>
              <option value="rewrite_same_format">Rewrite in same format</option>
              <option value="make_shorter">Make shorter</option>
              <option value="make_casual">Make casual</option>
              <option value="make_punchy">Make punchy</option>
              <option value="list_beats">List beats</option>
            </select>
            {helperMutation.error ? (
              <p className="mt-3 text-sm text-destructive">{helperMutation.error.message}</p>
            ) : null}
            {helperResult ? <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{helperResult}</pre> : null}
          </section>

          <section className="rounded-md border bg-card p-5">
            <h2 className="text-lg font-semibold">Linked inspiration</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose up to five saved references.</p>
            <div className="mt-4 max-h-[560px] space-y-3 overflow-auto pr-1">
              {videos.map((video) => (
                <label key={video.id} className="flex cursor-pointer gap-3 rounded-md border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={referenceIds.includes(video.id)}
                    onChange={() => toggleReference(video.id)}
                    className="mt-1 size-4"
                  />
                  <span>
                    <span className="block font-medium">{video.title || "Untitled reference"}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {video.platform} {video.creator ? `by ${video.creator}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ScriptField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  const id = label.toLowerCase();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-md border bg-background p-3 text-sm leading-6"
      />
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-secondary px-2 py-1 font-medium text-secondary-foreground">{children}</span>;
}

function renderHelperResult(result: {
  cleanScript?: string;
  summary?: string;
  hook?: string;
  cta?: string;
  beats?: string[];
  rewrites?: string[];
  notes?: string;
}) {
  return [
    result.summary,
    result.hook ? `Hook: ${result.hook}` : "",
    result.cta ? `CTA: ${result.cta}` : "",
    result.beats?.length ? `Beats:\n${result.beats.map((beat) => `- ${beat}`).join("\n")}` : "",
    result.rewrites?.length ? result.rewrites.join("\n\n") : "",
    result.cleanScript,
    result.notes,
  ]
    .filter(Boolean)
    .join("\n\n");
}
