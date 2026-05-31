import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Link2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { useCreateVideoMutation } from "~/lib/queries/content";

export const Route = createFileRoute("/dashboard/add-video")({
  component: AddVideoPage,
});

function AddVideoPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  const createVideoMutation = useCreateVideoMutation({
    onSuccess: (video) => {
      setUrl("");
      router.navigate({ to: "/dashboard/videos/$videoId", params: { videoId: video.id } });
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;
    await createVideoMutation.mutateAsync({ url });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Capture reference</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Add a video</h1>
      </div>

      <section className="rounded-md border bg-card p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL</Label>
            <div className="flex gap-2">
              <Input
                id="video-url"
                placeholder="Paste a YouTube, TikTok, or Instagram URL"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
              <Button type="submit" disabled={createVideoMutation.isPending}>
                <Link2 />
                {createVideoMutation.isPending ? "Analysing" : "Save"}
              </Button>
            </div>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4" />
            ContentLab will infer niche, format, tags, and notes from available metadata.
          </p>
          {createVideoMutation.error ? (
            <p className="text-sm text-destructive">{createVideoMutation.error.message}</p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
