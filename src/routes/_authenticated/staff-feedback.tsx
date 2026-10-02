import { createFileRoute, Link, type ErrorComponentProps } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FEEDBACK_ASPECTS, listFeedback, setFeedbackHandled } from "@/lib/feedback.functions";

export const Route = createFileRoute("/_authenticated/staff-feedback")({
  component: StaffFeedbackPage,
  errorComponent: ({ error }: ErrorComponentProps) => (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
    </main>
  ),
  notFoundComponent: () => <main className="p-8 text-muted-foreground">Nothing here.</main>,
  head: () => ({
    meta: [
      { title: "Staff feedback inbox — Dedicated Ultimatum Appointed Associates" },
      { name: "description", content: "Private inbox of customer reviews and complaints." },
      { property: "og:title", content: "Staff feedback inbox" },
      { property: "og:description", content: "Private staff view of reviews and complaints." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Filter = "open" | "handled" | "all";

function StaffFeedbackPage() {
  const fetchAll = useServerFn(listFeedback);
  const toggle = useServerFn(setFeedbackHandled);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("open");
  const q = useQuery({ queryKey: ["feedback"], queryFn: () => fetchAll() });

  const rows = (q.data ?? []).filter((f) =>
    filter === "all" ? true : filter === "handled" ? f.handled : !f.handled,
  );

  const mark = async (id: string, handled: boolean) => {
    try {
      await toggle({ data: { id, handled } });
      toast.success(handled ? "Marked as handled" : "Reopened");
      qc.invalidateQueries({ queryKey: ["feedback"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Reviews & complaints</h1>
          <Button variant="secondary" size="sm" onClick={() => q.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
        <div className="mt-4 flex gap-2">
          {(["open", "handled", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm capitalize",
                filter === f ? "border-primary bg-primary/10" : "border-border text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {q.isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}
        {q.error && <p className="mt-8 text-sm text-destructive">{(q.error as Error).message}</p>}
        {!q.isLoading && rows.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">No feedback in this view.</p>
        )}

        <div className="mt-6 space-y-4">
          {rows.map((f) => (
            <article key={f.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={f.kind === "complaint" ? "destructive" : "secondary"} className="capitalize">
                    {f.kind}
                  </Badge>
                  <span className="font-mono text-xs">{f.reference}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(f.created_at), "d MMM yyyy, HH:mm")}
                  </span>
                </div>
                <span className="font-mono text-sm">{f.overall ?? "—"} / 5</span>
              </div>
              <p className="mt-3 font-medium">{f.name}</p>
              <p className="text-sm text-muted-foreground">
                {f.email}
                {f.phone ? ` · ${f.phone}` : ""}
                {f.service ? ` · ${f.service}` : ""}
                {f.booking_reference ? ` · ${f.booking_reference}` : ""}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 md:grid-cols-7">
                {FEEDBACK_ASPECTS.map((a) => (
                  <div key={a.key} className="rounded-md bg-muted/50 px-2 py-1">
                    <span className="block text-muted-foreground">{a.label}</span>
                    <span className="font-mono">
                      {(f as Record<string, unknown>)[`rating_${a.key}`] as number | null ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
              {f.comments && <p className="mt-3 whitespace-pre-wrap text-sm">{f.comments}</p>}
              <div className="mt-4">
                <Button size="sm" variant={f.handled ? "secondary" : "default"} onClick={() => mark(f.id, !f.handled)}>
                  {f.handled ? "Reopen" : "Mark as handled"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
