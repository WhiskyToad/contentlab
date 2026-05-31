import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { getVideoDetail, runScriptHelper, updateVideo } from "~/lib/server/content-actions";
import { formatDuration, parseTags } from "~/lib/video-utils";
import type { AiHelperAction, VideoStatus } from "~/schema";

export const Route = createFileRoute("/dashboard/videos/$videoId")({
  loader: ({ params }) => getVideoDetail({ data: { id: params.videoId } }),
  component: VideoDetail,
});

function VideoDetail() {
  const video = Route.useLoaderData();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"transcript" | "clean" | "notes">("transcript");
  const [title, setTitle] = useState(video.title ?? "");
  const [creator, setCreator] = useState(video.creator ?? "");
  const [caption, setCaption] = useState(video.caption ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(video.thumbnail_url ?? "");
  const [niche, setNiche] = useState(video.niche ?? "");
  const [format, setFormat] = useState(video.format ?? "");
  const [tags, setTags] = useState(video.tags.join(", "));
  const [status, setStatus] = useState<VideoStatus>(video.status);
  const [rawTranscript, setRawTranscript] = useState(video.raw_transcript);
  const [cleanScript, setCleanScript] = useState(video.clean_script);
  const [notes, setNotes] = useState(video.notes);
  const [helperAction, setHelperAction] = useState<AiHelperAction>("clean_transcript");
  const [helperResult, setHelperResult] = useState("");

  const saveMutation = useMutation({
    mutationFn: () =>
      updateVideo({
        data: {
          id: video.id,
          title,
          creator,
          caption,
          thumbnail_url: thumbnailUrl,
          niche,
          format,
          tags: parseTags(tags),
          status,
          raw_transcript: rawTranscript,
          clean_script: cleanScript,
          notes,
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
          entityType: "video",
          entityId: video.id,
          action: helperAction,
          input: helperAction === "clean_transcript" ? rawTranscript : cleanScript || rawTranscript,
        },
      }),
    onSuccess: async (result) => {
      const rendered = renderHelperResult(result);
      setHelperResult(rendered);
      if (result.cleanScript) {
        setCleanScript(result.cleanScript);
        setActiveTab("clean");
      } else if (rendered) {
        const nextNotes = [notes, `AI helper: ${helperLabel(helperAction)}`, rendered].filter(Boolean).join("\n\n");
        setNotes(nextNotes);
        await updateVideo({ data: { id: video.id, notes: nextNotes } });
        setActiveTab("notes");
      }
      await router.invalidate();
    },
  });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{video.platform} reference</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title || "Untitled reference"}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Pill>{status}</Pill>
            <Pill>{creator || "Unknown creator"}</Pill>
            <Pill>{formatDuration(video.duration_seconds)}</Pill>
            {video.view_count ? <Pill>{video.view_count.toLocaleString()} views</Pill> : null}
          </div>
        </div>
        <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving" : "Save reference"}
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5 rounded-md border bg-card p-5">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="aspect-video w-full rounded-md object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
              No thumbnail
            </div>
          )}
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Creator" value={creator} onChange={setCreator} />
          <Field label="Thumbnail URL" value={thumbnailUrl} onChange={setThumbnailUrl} />
          <Field label="Niche" value={niche} onChange={setNiche} />
          <Field label="Format" value={format} onChange={setFormat} />
          <Field label="Tags" value={tags} onChange={setTags} placeholder="founder story, demo" />
          <div className="space-y-2">
            <Label htmlFor="video-status">Status</Label>
            <select
              id="video-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as VideoStatus)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="saved">Saved</option>
              <option value="used">Used</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="caption">Title/caption</Label>
            <textarea
              id="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              className="min-h-28 w-full rounded-md border bg-background p-3 text-sm"
            />
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-md border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <Label htmlFor="helper-action">Script helper</Label>
                <select
                  id="helper-action"
                  value={helperAction}
                  onChange={(event) => setHelperAction(event.target.value as AiHelperAction)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="clean_transcript">Clean transcript</option>
                  <option value="summarise_structure">Summarise structure</option>
                  <option value="extract_hook">Extract hook</option>
                  <option value="extract_cta">Extract CTA</option>
                  <option value="list_beats">List beats</option>
                </select>
              </div>
              <Button type="button" onClick={() => helperMutation.mutate()} disabled={helperMutation.isPending}>
                <Wand2 />
                {helperMutation.isPending ? "Working" : "Run helper"}
              </Button>
            </div>
            {helperMutation.error ? (
              <p className="mt-3 text-sm text-destructive">{helperMutation.error.message}</p>
            ) : null}
            {helperResult ? <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{helperResult}</pre> : null}
          </div>

          <div className="rounded-md border bg-card">
            <div className="flex border-b">
              <TabButton active={activeTab === "transcript"} onClick={() => setActiveTab("transcript")}>
                Transcript
              </TabButton>
              <TabButton active={activeTab === "clean"} onClick={() => setActiveTab("clean")}>
                Clean Script
              </TabButton>
              <TabButton active={activeTab === "notes"} onClick={() => setActiveTab("notes")}>
                Notes
              </TabButton>
            </div>
            <div className="p-4">
              {activeTab === "transcript" ? (
                <ScriptArea value={rawTranscript} onChange={setRawTranscript} placeholder="Paste the raw transcript here." />
              ) : null}
              {activeTab === "clean" ? (
                <ScriptArea value={cleanScript} onChange={setCleanScript} placeholder="Clean, readable version of the script." />
              ) : null}
              {activeTab === "notes" ? (
                <ScriptArea value={notes} onChange={setNotes} placeholder="Why this worked, useful angles, reusable beats." />
              ) : null}
            </div>
          </div>
        </section>
      </form>
    </div>
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

function ScriptArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-[520px] w-full resize-y rounded-md border bg-background p-4 text-sm leading-6"
    />
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium ${active ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-secondary px-2 py-1 font-medium text-secondary-foreground">{children}</span>;
}

function helperLabel(action: AiHelperAction) {
  return action.replaceAll("_", " ");
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
    result.cleanScript,
    result.summary,
    result.hook ? `Hook: ${result.hook}` : "",
    result.cta ? `CTA: ${result.cta}` : "",
    result.beats?.length ? `Beats:\n${result.beats.map((beat) => `- ${beat}`).join("\n")}` : "",
    result.rewrites?.length ? result.rewrites.join("\n\n") : "",
    result.notes,
  ]
    .filter(Boolean)
    .join("\n\n");
}
