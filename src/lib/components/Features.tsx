import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function Features() {
  return (
    <section className="py-32 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-16">Workspace flow</h2>
      <div className="grid md:grid-cols-3 gap-12">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Capture references</CardTitle>
            <CardDescription>Save videos into a script library</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Add URLs, metadata, tags, notes, raw transcripts, and cleaned scripts.
            </p>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Study structure</CardTitle>
            <CardDescription>Turn messy transcripts into useful references</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Extract hooks, beats, CTAs, and notes from the videos you want to learn from.
            </p>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Write your own</CardTitle>
            <CardDescription>Draft scripts with linked inspiration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Connect each draft to up to five references and move it from idea to posted.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
