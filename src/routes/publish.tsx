import { createFileRoute } from "@tanstack/react-router";
import { FacebookPublisher } from "@/components/FacebookPublisher";

export const Route = createFileRoute("/publish")({
  component: PublishPage,
  head: () => ({ meta: [{ title: "Publish — DUAA" }] }),
});

function PublishPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
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
