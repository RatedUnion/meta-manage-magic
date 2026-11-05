import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Eye, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewModeProvider, useViewMode } from "@/lib/view-mode";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <ViewModeProvider>
      <ShellHeader />
      <Outlet />
    </ViewModeProvider>
  ),
});

function ShellHeader() {
  const { viewOnly, setViewOnly } = useViewMode();
  const linkCls = "text-sm text-muted-foreground hover:text-foreground";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2">
        <nav className="flex flex-wrap items-center gap-3">
          <Link to="/bookings" className={linkCls} activeProps={{ className: "text-sm font-semibold text-foreground" }}>
            Bookings
          </Link>
          <Link to="/roster" className={linkCls} activeProps={{ className: "text-sm font-semibold text-foreground" }}>
            Roster
          </Link>
          <Link to="/campaigns" className={linkCls} activeProps={{ className: "text-sm font-semibold text-foreground" }}>
            Campaigns
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {viewOnly && (
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" /> Affiliate / View Mode
            </Badge>
          )}
          <Button size="sm" variant={viewOnly ? "default" : "outline"} onClick={() => setViewOnly(!viewOnly)}>
            {viewOnly ? <Pencil className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
            {viewOnly ? "Exit view mode" : "Preview affiliate view"}
          </Button>
        </div>
      </div>
    </header>
  );
}
