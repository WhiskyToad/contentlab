import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Header } from "~/lib/components/Header";
import { Hero } from "~/lib/components/Hero";
import { Features } from "~/lib/components/Features";
import { Footer } from "~/lib/components/Footer";
import { User } from "@supabase/supabase-js";
import { useSignOutMutation } from "~/lib/queries/auth";

export const Route = createFileRoute("/")({
  component: Home,
  loader: ({ context }) => {
    // Ensure we're using the latest user data from context
    return { user: context.user };
  },
});

function Home() {
  const { user } = Route.useLoaderData();
  const router = useRouter();
  const signOutMutation = useSignOutMutation({
    onSuccess: async (result) => {
      if (result?.error) {
        console.error("Error signing out:", result.message);
        return;
      }

      await router.invalidate();
      router.navigate({ to: "/signin", search: { error: "", redirect: "/dashboard" } });
    },
    onError: (error) => {
      console.error("Error signing out:", error);
    },
  });

  const handleSignOut = async () => {
    await signOutMutation.mutateAsync();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user as User | null} onSignOut={handleSignOut} />
      <main className="flex-1 pt-24 flex flex-col items-center">
        <div className="container mx-auto max-w-7xl px-6">
          <Hero user={user} />
          <Features />
        </div>
      </main>
      <Footer />
    </div>
  );
}
