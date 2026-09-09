import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, MessageSquareWarning, Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FEEDBACK_ASPECTS, submitFeedback, type AspectKey } from "@/lib/feedback.functions";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
  head: () => ({
    meta: [
      { title: "Reviews & complaints — Dedicated Ultimatum Appointed Associates" },
      {
        name: "description",
        content:
          "Rate our page, layout, timing, affordability, representative, duration and conclusions, or file a complaint about any job in Trinidad & Tobago.",
      },
      { property: "og:title", content: "Leave a review or file a complaint" },
      {
        property: "og:description",
        content: "A short rating sheet covering every part of our service, plus space to explain your concerns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const SCALE = [1, 2, 3, 4, 5] as const;
const SCALE_LABEL: Record<number, string> = {
  1: "Very poor",
  2: "Poor",
  3: "Acceptable",
  4: "Good",
  5: "Excellent",
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().max(30).optional(),
  service: z.string().trim().max(120).optional(),
  booking_reference: z.string().trim().max(40).optional(),
  comments: z.string().trim().max(2000).optional(),
});

type Ratings = Record<AspectKey, number>;

const EMPTY: Ratings = {
  page: 0,
  layout: 0,
  timing: 0,
  affordability: 0,
  representative: 0,
  duration: 0,
  conclusions: 0,
};

function FeedbackPage() {
  const send = useServerFn(submitFeedback);
  const [kind, setKind] = useState<"review" | "complaint">("review");
  const [ratings, setRatings] = useState<Ratings>(EMPTY);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    booking_reference: "",
    comments: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string; overall: number } | null>(null);

  const scored = Object.values(ratings).filter((v) => v > 0);
  const overall = useMemo(
    () => (scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : 0),
    [scored],
  );

  const set = (k: AspectKey, v: number) => setRatings((r) => ({ ...r, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = FEEDBACK_ASPECTS.filter((a) => !ratings[a.key]);
    if (missing.length) {
      toast.error("Please score every line", {
        description: missing.map((m) => m.label).join(", "),
      });
      return;
    }
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    if (kind === "complaint" && !parsed.data.comments) {
      toast.error("Tell us what went wrong so we can act on it");
      return;
    }

    setBusy(true);
    try {
      const result = await send({
        data: {
          kind,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone || undefined,
          service: parsed.data.service || undefined,
          booking_reference: parsed.data.booking_reference || undefined,
          comments: parsed.data.comments || undefined,
          ratings: ratings as Required<Ratings>,
        },
      });
      setDone(result);
      toast.success(kind === "complaint" ? "Complaint filed" : "Review received", {
        description: `Reference ${result.reference}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your feedback");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {kind === "complaint" ? "Your complaint is logged" : "Thank you for the review"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Reference <span className="font-mono text-foreground">{done.reference}</span> · overall score{" "}
            <span className="font-medium text-foreground">{done.overall.toFixed(2)} / 5</span>. Quote this
            reference if you contact us at +1 868-763-1106 or delegated@live.com.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="secondary">
              <Link to="/">Back to home</Link>
            </Button>
            <Button asChild>
              <Link to="/book">Book another job</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Reviews & complaints</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Score every part of the experience on the sheet below — one line per area, 1 (very poor) to 5
          (excellent) — then add anything you want us to know. Complaints reach us the same day.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          <div className="flex flex-wrap gap-2">
            {(["review", "complaint"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm capitalize transition-colors",
                  kind === k
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {k === "review" ? <Star className="h-4 w-4" /> : <MessageSquareWarning className="h-4 w-4" />}
                {k}
              </button>
            ))}
          </div>

          {/* Rating tabulet */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-left">
                  <th className="px-4 py-3 font-medium">Area of concern</th>
                  {SCALE.map((s) => (
                    <th key={s} className="px-2 py-3 text-center font-medium" title={SCALE_LABEL[s]}>
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEEDBACK_ASPECTS.map((a, i) => (
                  <tr key={a.key} className={cn("border-t border-border", i % 2 === 1 && "bg-muted/20")}>
                    <td className="px-4 py-3">
                      <span className="block font-medium">{a.label}</span>
                      <span className="block text-xs text-muted-foreground">{a.hint}</span>
                    </td>
                    {SCALE.map((s) => (
                      <td key={s} className="px-2 py-3 text-center">
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input
                            type="radio"
                            name={a.key}
                            value={s}
                            checked={ratings[a.key] === s}
                            onChange={() => set(a.key, s)}
                            className="sr-only"
                            aria-label={`${a.label}: ${s} — ${SCALE_LABEL[s]}`}
                          />
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors",
                              ratings[a.key] === s
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:border-primary/60",
                            )}
                          >
                            {s}
                          </span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-border bg-muted/40">
                  <td className="px-4 py-3 font-medium">Overall score</td>
                  <td colSpan={5} className="px-4 py-3 text-right font-mono">
                    {scored.length ? `${overall.toFixed(2)} / 5` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service (optional)</Label>
              <Input
                id="service"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                placeholder="Mobile mechanic, electrician…"
                maxLength={120}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ref">Booking reference (optional)</Label>
              <Input
                id="ref"
                value={form.booking_reference}
                onChange={(e) => setForm({ ...form, booking_reference: e.target.value })}
                placeholder="DUA-XXXXXX"
                maxLength={40}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="comments">
                {kind === "complaint" ? "What went wrong?" : "Anything else you want to add?"}
              </Label>
              <Textarea
                id="comments"
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                rows={5}
                maxLength={2000}
                placeholder={
                  kind === "complaint"
                    ? "Describe the issue, when it happened and what you would like done about it."
                    : "Tell us what worked well."
                }
              />
              <p className="text-xs text-muted-foreground">{form.comments.length}/2000</p>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
            {busy ? "Sending…" : kind === "complaint" ? "File complaint" : "Submit review"}
          </Button>
        </form>
      </div>
    </main>
  );
}
