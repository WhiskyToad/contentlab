import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

interface HeroProps {
  user: any | null;
}

export function Hero({ user }: HeroProps) {
  return (
    <section className="py-24 text-center max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold tracking-tight mb-6">ContentLab</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Save scripts from videos you like, study what works, and write your own scripts in one place.
      </p>
      <div className="flex gap-4 justify-center">
        {user ? (
          <Button asChild size="lg">
            <Link to="/dashboard">Open workspace</Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link to="/signin" search={{ error: "", redirect: "/dashboard" }}>Sign in</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/signup" search={{ redirect: "/dashboard" }}>Create account</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
