import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Facebook, MapPin, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FacebookPublisher } from "@/components/FacebookPublisher";

export const Route = createFileRoute("/publish")({
  component: PublishPage,
  head: () => ({ meta: [{ title: "Facebook Publisher & QR Campaigns — DUAA" }, { name: "robots", content: "noindex" }] }),
});

function PublishPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/bookings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to bookings</Link>
        <header className="space-y-3">
          <Badge variant="secondary" className="gap-2"><Facebook className="h-3.5 w-3.5" />Meta Pages</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Publisher & QR campaigns</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">Prepare a Facebook Page post, select a Trinidad or Tobago campaign area, preview the Google Maps destination, and optionally attach a QR flyer.</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1 rounded-full border px-3 py-1"><MapPin className="h-3.5 w-3.5" />Location-targeted post</span><span className="inline-flex items-center gap-1 rounded-full border px-3 py-1"><QrCode className="h-3.5 w-3.5" />Booking or Maps QR</span></div>
        </header>
        <FacebookPublisher />
        <p className="text-xs text-muted-foreground">Publishing requires a connected Page with valid Meta authorization. Check the preview and post copy before publishing.</p>
      </div>
    </main>
  );
}
