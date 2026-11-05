import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FacebookPublisher } from "@/components/FacebookPublisher";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/publish")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  component: PublishPage,
  head: () => ({ meta: [{ title: "Publish — DUAA" }, { name: "robots", content: "noindex" }] }),
});

function PublishPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/bookings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to bookings
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Marketing tools</p>
          <h1 className="text-3xl font-semibold tracking-tight">Publish</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Share campaign updates, landing-page links, and promo copy to your connected Meta Pages without leaving the dashboard.
          </p>
        </div>

        <FacebookPublisher />
      </div>
    </main>
  );
}
