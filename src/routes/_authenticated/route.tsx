import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Bot, Eye, Megaphone, Pencil, Radio, Users, Activity, CalendarDays, Facebook } from "lucide-react";
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
  component: () => <ViewModeProvider><ShellHeader /><Outlet /></ViewModeProvider>,
});

const DASHBOARD_LINKS = [
  { to: "/bookings", label: "Bookings", Icon: CalendarDays },
  { to: "/roster", label: "Roster", Icon: Users },
  { to: "/campaigns", label: "Campaigns", Icon: Megaphone },
  { to: "/publish", label: "Publisher", Icon: Facebook },
  { to: "/assistants", label: "AI Bots", Icon: Bot },
  { to: "/monitoring", label: "Monitoring", Icon: Activity },
  { to: "/voice-sms", label: "Voice & SMS", Icon: Radio },
] as const;

function ShellHeader() {
  const { viewOnly, setViewOnly } = useViewMode();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
        <nav aria-label="Owner dashboard" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {DASHBOARD_LINKS.map(({ to, label, Icon }) => <Link key={to} to={to} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "inline-flex items-center gap-1.5 text-sm font-semibold text-foreground" }}><Icon className="h-3.5 w-3.5" />{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {viewOnly && <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" />Affiliate / View Mode</Badge>}
          <Button size="sm" variant={viewOnly ? "default" : "outline"} onClick={() => setViewOnly(!viewOnly)}>{viewOnly ? <Pencil className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}{viewOnly ? "Exit view mode" : "Preview affiliate view"}</Button>
        </div>
      </div>
    </header>
  );
}
