import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { FacebookPublisher } from "@/components/FacebookPublisher";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/publish")({
  component: PublishPage,
  head: () => ({ meta: [{ title: "Publish to Facebook — DUAA" }] }),
});

function PublishPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/campaigns">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to campaigns
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <Send className="h-7 w-7 text-primary" /> Publish a post
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect a Facebook Page, review your message, and publish when you’re ready.
            </p>
          </div>
        </header>
        <FacebookPublisher />
      </div>
    </main>
  );
}
