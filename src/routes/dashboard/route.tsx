import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { BarChart3, FileText, Home, Library, Plus, Video } from "lucide-react";
import ThemeToggle from "~/lib/components/ThemeToggle";

// Create a server function to check authentication
const checkAuth = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { getSupabaseServerClient } = await import("~/lib/server/auth");
    const supabase = getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { authenticated: false };
    }
    
    // Return only serializable user data
    const { id, email, user_metadata, app_metadata } = user;
    return { 
      authenticated: true,
      user: { id, email, user_metadata, app_metadata }
    };
  } catch (error) {
    console.error(error);
    return { authenticated: false };
  }
});

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  loader: async ({ context }) => {
    // Invalidate the query to ensure fresh data
    await context.queryClient.invalidateQueries({ queryKey: ["dashboard-auth"] });
    
    // Use the server function to check authentication
    const result = await context.queryClient.fetchQuery({
      queryKey: ["dashboard-auth"],
      queryFn: () => checkAuth(),
      staleTime: 0, // Consider the data stale immediately
    });

    if (!result.authenticated) {
      throw redirect({
        to: "/signin",
        search: {
          error: "unauthorized",
          redirect: "/dashboard",
        }
      });
    }

    return { user: result.user };
  },
});

function DashboardLayout() {
  const { user } = Route.useLoaderData();
  
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b bg-card lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-5">
            <Link to="/dashboard" className="font-semibold tracking-tight">
              ContentLab
            </Link>
            <ThemeToggle />
          </div>
          <nav className="grid gap-1 p-3 text-sm">
            <SidebarLink icon={<Home />} label="Dashboard" to="/dashboard" />
            <SidebarLink icon={<Plus />} label="Add video" to="/dashboard/add-video" />
            <SidebarLink icon={<Library />} label="Library" to="/dashboard/library" />
            <SidebarLink icon={<FileText />} label="Scripts" to="/dashboard/scripts" />
            <SidebarLink icon={<BarChart3 />} label="Research" to="/dashboard/research" />
            <SidebarLink icon={<Video />} label="Filming queue" to="/dashboard/filming" />
          </nav>
          <div className="mt-auto border-t p-4">
            <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
            <p className="mt-1 truncate text-sm">{user?.email}</p>
            <Link to="/" className="mt-3 inline-flex text-sm text-muted-foreground hover:text-foreground">
              Back to landing
            </Link>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({
  icon,
  label,
  to,
}: {
  icon: React.ReactElement;
  label: string;
  to:
    | "/dashboard"
    | "/dashboard/add-video"
    | "/dashboard/library"
    | "/dashboard/scripts"
    | "/dashboard/research"
    | "/dashboard/filming";
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
