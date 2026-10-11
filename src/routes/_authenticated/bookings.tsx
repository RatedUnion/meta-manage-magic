import { createFileRoute, Link, useNavigate, type ErrorComponentProps } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CalendarDays, CreditCard, Images, LogOut, Mail, Phone, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { listBookings, updateBookingStatus, updatePaymentStatus, getBookingPhotoUrls } from "@/lib/bookings.functions";


export const Route = createFileRoute("/_authenticated/bookings")({
  component: BookingsPage,
  errorComponent: ({ error }: ErrorComponentProps) => (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-xl font-semibold">Could not load bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-muted-foreground">Nothing here.</p>
    </main>
  ),
  head: () => ({
    meta: [
      { title: "Booking history — Dedicated Ultimatum Appointed Associates" },
      {
        name: "description",
        content: "Private dashboard listing every appointment request submitted through the booking form.",
      },
      { property: "og:title", content: "Booking history — Dedicated Ultimatum" },
      { property: "og:description", content: "Private staff dashboard of past and upcoming bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
const PAY_FILTERS = ["all", "awaiting", "paid", "unpaid"] as const;

/** Fetches short-lived signed URLs and shows a booking's uploaded photos. */
function BookingPhotos({ paths }: { paths: string[] }) {
  const fetchUrls = useServerFn(getBookingPhotoUrls);
  
  const { data: urls = [], isLoading: loading } = useQuery({
    queryKey: ["booking-photos", paths],
    queryFn: async () => (await fetchUrls({ data: { paths } })).urls,
    staleTime: 10 * 60 * 1000,
  });
  

  return (
    <div className="mt-3">
      
        
        
      
    
        <div className="mt-3 flex flex-wrap gap-3">
          {loading && <p className="text-sm text-muted-foreground">Loading photos…</p>}
          {urls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border">
              <img src={url} alt="Customer-submitted photo" className="h-28 w-28 object-cover" />
            </a>
          ))}
        </div>
      
    </div>
  );
}

const statusTone: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  completed: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const payTone: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  pending_review: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  unpaid: "bg-muted text-muted-foreground border-border",
  refunded: "bg-destructive/10 text-destructive border-destructive/30",
};

const payLabel: Record<string, string> = {
  paid: "Paid",
  pending_review: "Awaiting confirmation",
  refunded: "Refunded",
  unpaid: "Unpaid",
};

function money(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  return `${Number(amount).toFixed(2)} ${currency ?? ""}`.trim();
}


function BookingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchBookings = useServerFn(listBookings);
  const setStatus = useServerFn(updateBookingStatus);
  const setPayment = useServerFn(updatePaymentStatus);
  const [q, setQ] = useState("");
  const [payFilter, setPayFilter] = useState<(typeof PAY_FILTERS)[number]>("all");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchBookings(),
  });

  const counts = useMemo(() => {
    const list = data ?? [];
    const paid = list.filter((b) => b.payment_status === "paid").length;
    const awaiting = list.filter((b) => b.payment_status === "pending_review").length;
    return { all: list.length, awaiting, paid, unpaid: list.length - paid - awaiting };
  }, [data]);

  const paymentSummary = useMemo(() => {
    const list = data ?? [];
    const approvedByCurrency = new Map<string, number>();
    let awaiting = 0;
    let awaitingAmount = new Map<string, number>();
    let declined = 0;
    for (const b of list) {
      const cur = b.payment_currency ?? "TTD";
      const amt = Number(b.payment_amount ?? 0);
      if (b.payment_status === "paid") {
        approvedByCurrency.set(cur, (approvedByCurrency.get(cur) ?? 0) + amt);
      } else if (b.payment_status === "pending_review") {
        awaiting += 1;
        awaitingAmount.set(cur, (awaitingAmount.get(cur) ?? 0) + amt);
      } else if (b.payment_status === "unpaid" || b.payment_status === "refunded") {
        declined += 1;
      }
    }
    const fmt = (m: Map<string, number>) =>
      m.size === 0
        ? "0"
        : [...m.entries()].map(([c, a]) => `${a.toFixed(2)} ${c}`).join(" · ");
    return {
      approved: fmt(approvedByCurrency),
      approvedCount: counts.paid,
      awaiting,
      awaitingTotal: fmt(awaitingAmount),
      declined,
    };
  }, [data, counts.paid]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (payFilter === "paid") list = list.filter((b) => b.payment_status === "paid");
    if (payFilter === "awaiting") list = list.filter((b) => b.payment_status === "pending_review");
    if (payFilter === "unpaid")
      list = list.filter((b) => b.payment_status !== "paid" && b.payment_status !== "pending_review");
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((b) =>
      [b.reference, b.name, b.email, b.phone, b.service, b.status, b.payment_status, b.payment_reference ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data, q, payFilter]);

  const onStatus = async (id: string, status: (typeof STATUSES)[number]) => {
    try {
      await setStatus({ data: { id, status } });
      toast.success(`Marked ${status}`);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const onPayment = async (
    id: string,
    payment_status: "unpaid" | "pending_review" | "paid" | "refunded",
  ) => {
    try {
      await setPayment({ data: { id, payment_status } });
      toast.success(`Marked ${payment_status}`);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };


  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Booking history</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data
                ? `${counts.all} booking${counts.all === 1 ? "" : "s"} saved · ${counts.awaiting} awaiting confirmation · ${counts.paid} paid · ${counts.unpaid} unpaid`
                : "Loading bookings…"}
            </p>

          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by reference, name, email, phone, service or payment"
            className="pl-9"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PAY_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setPayFilter(f)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
                payFilter === f
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {f === "all" ? "All" : f} ({counts[f]})
            </button>
          ))}
        </div>


        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Approved payments</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">{paymentSummary.approved}</p>
            <p className="mt-1 text-xs text-emerald-700/80">
              {paymentSummary.approvedCount} booking{paymentSummary.approvedCount === 1 ? "" : "s"} confirmed paid
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Awaiting your approval</p>
            <p className="mt-1 text-xl font-semibold text-amber-700">{paymentSummary.awaiting}</p>
            <p className="mt-1 text-xs text-amber-700/80">
              {paymentSummary.awaiting > 0 ? `${paymentSummary.awaitingTotal} to verify in First Citizens Acc. 003108954` : "No payments waiting"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Declined / unpaid</p>
            <p className="mt-1 text-xl font-semibold">{paymentSummary.declined}</p>
            <p className="mt-1 text-xs text-muted-foreground">Payments declined or not yet submitted</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && rows.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No bookings yet. New requests from the booking form appear here.
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-4">
                <Link to="/book">Open booking form</Link>
              </Button>
            </div>
          )}

          {rows.map((b) => (
            <article key={b.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{b.service}</h2>
                    <Badge variant="outline" className={statusTone[b.status] ?? ""}>
                      {b.status}
                    </Badge>
                    <Badge variant="outline" className={payTone[b.payment_status] ?? ""}>
                      {payLabel[b.payment_status] ?? "Unpaid"}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">{b.reference}</span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(parseISO(b.booking_date), "EEE d MMM yyyy")} · {b.booking_time}
                    {b.photo_count > 0 && ` · ${b.photo_count} photo${b.photo_count === 1 ? "" : "s"}`}
                  </p>
                  {Array.isArray(b.photo_paths) && b.photo_paths.length > 0 && (
                    <BookingPhotos paths={b.photo_paths} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Received {format(new Date(b.created_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>

              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <p className="font-medium">{b.name}</p>
                <a href={`mailto:${b.email}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Mail className="h-4 w-4" /> {b.email}
                </a>
                <a href={`tel:${b.phone}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Phone className="h-4 w-4" /> {b.phone}
                </a>
                {b.calendar_event_url && (
                  <a
                    href={b.calendar_event_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <CalendarDays className="h-4 w-4" /> Calendar event
                  </a>
                )}
              </div>

              {b.notes && <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">{b.notes}</p>}


              {(b.payment_status === "paid" || b.payment_status === "pending_review") && (
                <div
                  className={cn(
                    "mt-3 rounded-lg px-3 py-2 text-sm",
                    b.payment_status === "paid"
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-amber-500/10 text-amber-700",
                  )}
                >
                  <p className="inline-flex flex-wrap items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {money(b.payment_amount, b.payment_currency) ?? "Payment submitted"}
                    {b.payment_method ? ` · ${b.payment_method}` : ""}
                    {b.payment_reference ? ` · ${b.payment_reference}` : ""}
                    {b.paid_at ? ` · ${format(new Date(b.paid_at), "d MMM yyyy, HH:mm")}` : ""}
                  </p>
                  {b.payment_status === "pending_review" && (
                    <p className="mt-1 text-xs">
                      Check First Citizens Bank Acc. 003108954 for this amount, then confirm it below.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.filter((s) => s !== b.status).map((s) => (
                  <Button key={s} size="sm" variant="outline" onClick={() => onStatus(b.id, s)}>
                    Mark {s}
                  </Button>
                ))}
                {b.payment_status === "pending_review" && (
                  <>
                    <Button size="sm" onClick={() => onPayment(b.id, "paid")}>
                      Approve payment
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onPayment(b.id, "unpaid")}>
                      Decline payment
                    </Button>
                  </>
                )}
                {b.payment_status === "paid" && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => onPayment(b.id, "unpaid")}>
                      Mark unpaid
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onPayment(b.id, "refunded")}>
                      Mark refunded
                    </Button>
                  </>
                )}
                {(b.payment_status === "unpaid" || b.payment_status === "refunded") && (
                  <Button size="sm" variant="secondary" onClick={() => onPayment(b.id, "paid")}>
                    Mark paid
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>

      </div>
    </main>
  );
}
