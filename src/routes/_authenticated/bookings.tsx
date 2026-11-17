import { ManualBookingDialog } from "@/components/ManualBookingDialog";
import { createFileRoute, Link, useNavigate, type ErrorComponentProps } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CalendarDays, CreditCard, Images, LogOut, Mail, Pencil, Phone, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useViewMode } from "@/lib/view-mode";
import { supabase } from "@/integrations/supabase/client";
import {
  listBookings,
  updateBookingStatus,
  updatePaymentStatus,
  getBookingPhotoUrls,
  runCustomDashboardAction,
} from "@/lib/bookings.functions";
import { updateBookingDetails } from "@/lib/booking-edit.functions";

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
      { name: "description", content: "Private staff dashboard to review, edit and manage appointment requests." },
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
const BOOKING_SERVICES = [
  "Mobile Mechanic",
  "Electrician",
  "Online Booking Consultation",
  "Online Technical Class",
  "Transport & Towing (Sold Separately)",
  "Landscaping & Garden Decor",
];

type BookingRow = Awaited<ReturnType<typeof listBookings>>[number];
type BookingEditValues = {
  service: string;
  booking_date: string;
  booking_time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

function PhotoModal({ urls, onClose }: { urls: string[]; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Booking photos">
      <div className="relative max-h-[90vh] max-w-2xl">
        <button type="button" onClick={onClose} className="absolute -right-10 -top-10 p-2 text-white hover:text-gray-300" aria-label="Close gallery">
          <X className="h-6 w-6" />
        </button>
        <img src={urls[currentIndex]} alt={`Photo ${currentIndex + 1}`} className="max-h-[80vh] w-auto rounded-lg object-contain" />
        {urls.length > 1 && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setCurrentIndex((i) => (i - 1 + urls.length) % urls.length)} className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30">← Previous</button>
            <span className="text-sm text-gray-300">{currentIndex + 1} / {urls.length}</span>
            <button type="button" onClick={() => setCurrentIndex((i) => (i + 1) % urls.length)} className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingPhotos({ paths, onOpen }: { paths: string[]; onOpen: (urls: string[]) => void }) {
  const fetchUrls = useServerFn(getBookingPhotoUrls);
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setLoading(true);
    try {
      const response = await fetchUrls({ data: { paths } });
      if (response.urls.length) onOpen(response.urls);
      else toast.info("No photos could be loaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load photos");
    } finally {
      setLoading(false);
    }
  };

  return <Button size="sm" variant="outline" onClick={() => void open()} disabled={loading} className="mt-3 gap-2"><Images className="h-4 w-4" />{loading ? "Loading photos…" : `Show images (${paths.length})`}</Button>;
}

function EditBookingDialog({
  booking,
  saving,
  onClose,
  onSave,
}: {
  booking: BookingRow;
  saving: boolean;
  onClose: () => void;
  onSave: (values: BookingEditValues) => Promise<void>;
}) {
  const [values, setValues] = useState<BookingEditValues>({
    service: booking.service,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time.slice(0, 5),
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    notes: booking.notes ?? "",
  });

  const set = <K extends keyof BookingEditValues>(key: K, value: BookingEditValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-booking-title">
      <div className="my-auto w-full max-w-xl rounded-xl border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-booking-title" className="text-xl font-semibold">Edit booking</h2>
            <p className="mt-1 text-sm text-muted-foreground">Reference: <span className="font-mono">{booking.reference}</span></p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close edit form"><X className="h-4 w-4" /></Button>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave(values);
          }}
        >
          <label className="block space-y-1 text-sm font-medium">
            Service
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={values.service} onChange={(event) => set("service", event.target.value)} required>
              {!BOOKING_SERVICES.includes(values.service) && <option value={values.service}>{values.service}</option>}
              {BOOKING_SERVICES.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm font-medium">Date<Input type="date" value={values.booking_date} onChange={(event) => set("booking_date", event.target.value)} required /></label>
            <label className="block space-y-1 text-sm font-medium">Time<Input type="time" value={values.booking_time} onChange={(event) => set("booking_time", event.target.value)} required /></label>
            <label className="block space-y-1 text-sm font-medium">Customer name<Input value={values.name} onChange={(event) => set("name", event.target.value)} minLength={2} maxLength={100} required /></label>
            <label className="block space-y-1 text-sm font-medium">Email<Input type="email" value={values.email} onChange={(event) => set("email", event.target.value)} maxLength={255} required /></label>
            <label className="block space-y-1 text-sm font-medium sm:col-span-2">Phone<Input type="tel" value={values.phone} onChange={(event) => set("phone", event.target.value)} minLength={7} maxLength={30} required /></label>
          </div>
          <label className="block space-y-1 text-sm font-medium">Notes<Textarea rows={4} maxLength={1000} value={values.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Booking notes and location details" /></label>
          <p className="text-xs text-muted-foreground">Editing these details does not change the booking reference, payment status, photos, or existing calendar invitation.</p>
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save booking changes"}</Button>
          </div>
        </form>
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
const payLabel: Record<string, string> = { paid: "Paid", pending_review: "Awaiting confirmation", refunded: "Refunded", unpaid: "Unpaid" };

function money(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  return `${Number(amount).toFixed(2)} ${currency ?? ""}`.trim();
}

function BookingCard({
  booking,
  viewOnly,
  onEdit,
  onStatus,
  onPayment,
  onAudit,
  onPhotos,
}: {
  booking: BookingRow;
  viewOnly: boolean;
  onEdit: (booking: BookingRow) => void;
  onStatus: (id: string, status: (typeof STATUSES)[number]) => void;
  onPayment: (id: string, paymentStatus: "unpaid" | "pending_review" | "paid" | "refunded") => void;
  onAudit: (bookingId: string) => void;
  onPhotos: (urls: string[]) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{booking.service}</h2>
            <Badge variant="outline" className={statusTone[booking.status] ?? ""}>{booking.status}</Badge>
            <Badge variant="outline" className={payTone[booking.payment_status] ?? ""}>{payLabel[booking.payment_status] ?? "Unpaid"}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{booking.reference}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(parseISO(booking.booking_date), "EEE d MMM yyyy")} · {booking.booking_time}
            {booking.photo_count > 0 && ` · ${booking.photo_count} photo${booking.photo_count === 1 ? "" : "s"}`}
          </p>
          {Array.isArray(booking.photo_paths) && booking.photo_paths.length > 0 && <BookingPhotos paths={booking.photo_paths} onOpen={onPhotos} />}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Received {format(new Date(booking.created_at), "d MMM yyyy, HH:mm")}</p>
          {!viewOnly && <Button size="sm" variant="outline" onClick={() => onEdit(booking)}><Pencil className="mr-2 h-4 w-4" />Edit booking</Button>}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p className="font-medium">{booking.name}</p>
        <a href={`mailto:${booking.email}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="h-4 w-4" />{booking.email}</a>
        <a href={`tel:${booking.phone}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="h-4 w-4" />{booking.phone}</a>
        {booking.calendar_event_url && booking.calendar_event_url !== "pending" && (
          <a href={booking.calendar_event_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><CalendarDays className="h-4 w-4" />Calendar event</a>
        )}
      </div>

      {booking.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{booking.notes}</p>}
      {(booking.payment_status === "paid" || booking.payment_status === "pending_review") && (
        <div className={cn("mt-3 rounded-lg px-3 py-2 text-sm", booking.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700")}>
          <p className="inline-flex flex-wrap items-center gap-2">
            <CreditCard className="h-4 w-4" />{money(booking.payment_amount, booking.payment_currency) ?? "Payment submitted"}
            {booking.payment_method ? ` · ${booking.payment_method}` : ""}
            {booking.payment_reference ? ` · ${booking.payment_reference}` : ""}
            {booking.paid_at ? ` · ${format(new Date(booking.paid_at), "d MMM yyyy, HH:mm")}` : ""}
          </p>
          {booking.payment_status === "pending_review" && <p className="mt-1 text-xs">Verify the payment before approving it.</p>}
        </div>
      )}

      {!viewOnly && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <span className="mr-1 self-center text-xs font-medium text-muted-foreground">Booking status:</span>
          {STATUSES.filter((status) => status !== booking.status).map((status) => <Button key={status} size="sm" variant="outline" onClick={() => onStatus(booking.id, status)}>Mark {status}</Button>)}
          {booking.payment_status === "pending_review" && <>
            <Button size="sm" onClick={() => onPayment(booking.id, "paid")}>Approve payment</Button>
            <Button size="sm" variant="ghost" onClick={() => onPayment(booking.id, "unpaid")}>Decline payment</Button>
          </>}
          {booking.payment_status === "paid" && <>
            <Button size="sm" variant="ghost" onClick={() => onPayment(booking.id, "unpaid")}>Mark unpaid</Button>
            <Button size="sm" variant="ghost" onClick={() => onPayment(booking.id, "refunded")}>Mark refunded</Button>
          </>}
          {(booking.payment_status === "unpaid" || booking.payment_status === "refunded") && <Button size="sm" variant="outline" onClick={() => onAudit(booking.id)}>Audit Task</Button>}
        </div>
      )}
    </article>
  );
}

function BookingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchBookings = useServerFn(listBookings);
  const setStatus = useServerFn(updateBookingStatus);
  const setPayment = useServerFn(updatePaymentStatus);
  const fetchPhotoUrls = useServerFn(getBookingPhotoUrls);
  const executeCustomAction = useServerFn(runCustomDashboardAction);
  const saveBookingChanges = useServerFn(updateBookingDetails);

  const [q, setQ] = useState("");
  const [payFilter, setPayFilter] = useState<(typeof PAY_FILTERS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showAllImageModal, setShowAllImageModal] = useState(false);
  const [allImageUrls, setAllImageUrls] = useState<string[]>([]);
  const [loadingAllImages, setLoadingAllImages] = useState(false);
  const { viewOnly } = useViewMode();

  const { data, isLoading, isFetching, refetch } = useQuery({ queryKey: ["bookings"], queryFn: () => fetchBookings() });
  const counts = useMemo(() => {
    const list = data ?? [];
    const paid = list.filter((booking) => booking.payment_status === "paid").length;
    const awaiting = list.filter((booking) => booking.payment_status === "pending_review").length;
    return { all: list.length, awaiting, paid, unpaid: list.length - paid - awaiting };
  }, [data]);

  const paymentSummary = useMemo(() => {
    const approvedByCurrency = new Map<string, number>();
    const awaitingByCurrency = new Map<string, number>();
    let awaiting = 0;
    let declined = 0;
    for (const booking of data ?? []) {
      const currency = booking.payment_currency ?? "TTD";
      const amount = Number(booking.payment_amount ?? 0);
      if (booking.payment_status === "paid") approvedByCurrency.set(currency, (approvedByCurrency.get(currency) ?? 0) + amount);
      else if (booking.payment_status === "pending_review") {
        awaiting += 1;
        awaitingByCurrency.set(currency, (awaitingByCurrency.get(currency) ?? 0) + amount);
      } else if (booking.payment_status === "unpaid" || booking.payment_status === "refunded") declined += 1;
    }
    const formatTotals = (totals: Map<string, number>) => totals.size ? [...totals.entries()].map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`).join(" · ") : "0";
    return { approved: formatTotals(approvedByCurrency), awaiting, awaitingTotal: formatTotals(awaitingByCurrency), declined };
  }, [data]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (payFilter === "paid") list = list.filter((booking) => booking.payment_status === "paid");
    if (payFilter === "awaiting") list = list.filter((booking) => booking.payment_status === "pending_review");
    if (payFilter === "unpaid") list = list.filter((booking) => booking.payment_status !== "paid" && booking.payment_status !== "pending_review");
    if (statusFilter !== "all") list = list.filter((booking) => booking.status === statusFilter);
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((booking) => [booking.reference, booking.name, booking.email, booking.phone, booking.service, booking.status, booking.payment_status, booking.payment_reference ?? "", booking.notes ?? ""].join(" ").toLowerCase().includes(needle));
  }, [data, q, payFilter, statusFilter]);

  const allPhotoPaths = useMemo(() => Array.from(new Set(rows.flatMap((booking) => Array.isArray(booking.photo_paths) ? booking.photo_paths : []))), [rows]);

  const onStatus = async (id: string, status: (typeof STATUSES)[number]) => {
    try {
      await setStatus({ data: { id, status } });
      toast.success(`Booking marked ${status}`);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Booking status update failed"); }
  };

  const onPayment = async (id: string, payment_status: "unpaid" | "pending_review" | "paid" | "refunded") => {
    try {
      await setPayment({ data: { id, payment_status } });
      toast.success(`Payment marked ${payment_status}`);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Payment update failed"); }
  };

  const onSaveEdit = async (values: BookingEditValues) => {
    if (!selectedBooking) return;
    setSavingEdit(true);
    try {
      await saveBookingChanges({ data: { id: selectedBooking.id, ...values, notes: values.notes.trim() || null } });
      toast.success("Booking details updated");
      setSelectedBooking(null);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update booking");
    } finally {
      setSavingEdit(false);
    }
  };

  const openAllImages = async () => {
    if (!allPhotoPaths.length) return toast.info("No photos available to display.");
    setLoadingAllImages(true);
    try {
      const urls: string[] = [];
      for (let index = 0; index < allPhotoPaths.length; index += 20) {
        const response = await fetchPhotoUrls({ data: { paths: allPhotoPaths.slice(index, index + 20) } });
        urls.push(...response.urls);
      }
      if (!urls.length) return toast.info("No photos could be loaded.");
      setAllImageUrls(urls);
      setShowAllImageModal(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load photos"); }
    finally { setLoadingAllImages(false); }
  };

  const openPhotos = (urls: string[]) => {
    setAllImageUrls(urls);
    setShowAllImageModal(true);
  };

  const onAudit = async (bookingId: string) => {
    try {
      await executeCustomAction({ data: { bookingId, notes: "Audited by staff" } });
      toast.success("Task audited");
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Audit action failed"); }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-10">
      {selectedBooking && !viewOnly && <EditBookingDialog booking={selectedBooking} saving={savingEdit} onClose={() => setSelectedBooking(null)} onSave={onSaveEdit} />}
      {showAllImageModal && allImageUrls.length > 0 && <PhotoModal urls={allImageUrls} onClose={() => setShowAllImageModal(false)} />}
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to site</Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Booking management</h1>
            <p className="mt-1 text-sm text-muted-foreground">{data ? `${counts.all} bookings · ${counts.awaiting} awaiting payment review · ${counts.paid} paid · ${counts.unpaid} unpaid or refunded` : "Loading bookings…"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void openAllImages()} disabled={loadingAllImages || allPhotoPaths.length === 0}><Images className="mr-2 h-4 w-4" />{loadingAllImages ? "Loading images…" : "Show all images"}</Button>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </header>

        <nav aria-label="Dashboard navigation" className="flex flex-wrap gap-2 border-y py-3">
          {[["/assistants", "AI Bots"], ["/monitoring", "Monitoring"], ["/campaigns", "Campaigns"], ["/publish", "Publish"], ["/voice-sms", "Voice & SMS"], ["/roster", "Roster"]].map(([to, label]) => (
            <Button key={to} variant="outline" size="sm" asChild><Link to={to as "/assistants"}>{label}</Link></Button>
          ))}
        </nav>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Payment summary">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"><p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Approved payments</p><p className="mt-1 text-xl font-semibold text-emerald-700">{paymentSummary.approved}</p><p className="mt-1 text-xs text-emerald-700/80">{counts.paid} booking{counts.paid === 1 ? "" : "s"} confirmed paid</p></div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"><p className="text-xs font-medium uppercase tracking-wide text-amber-700">Awaiting your approval</p><p className="mt-1 text-xl font-semibold text-amber-700">{paymentSummary.awaiting}</p><p className="mt-1 text-xs text-amber-700/80">{paymentSummary.awaiting > 0 ? `${paymentSummary.awaitingTotal} pending review` : "No payments waiting"}</p></div>
          <div className="rounded-xl border border-border bg-muted/50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Declined / unpaid</p><p className="mt-1 text-xl font-semibold">{paymentSummary.declined}</p><p className="mt-1 text-xs text-muted-foreground">Payments declined or not yet submitted</p></div>
        </section>

        <section className="space-y-3" aria-label="Search and filters">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search reference, customer, contact, service, notes or payment" className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Payment</span>
            {PAY_FILTERS.map((filter) => <button key={filter} type="button" onClick={() => setPayFilter(filter)} aria-pressed={payFilter === filter} className={cn("rounded-full border px-3 py-1.5 text-sm capitalize transition-colors", payFilter === filter ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/50")}>{filter === "all" ? "All" : filter} ({counts[filter]})</button>)}
            <label className="ml-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">Booking status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
                <option value="all">All statuses</option>
                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4" aria-label="Bookings">
          {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading bookings…</p>}
          {!isLoading && rows.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{data?.length ? "No bookings match these filters." : "No bookings yet. New requests from the booking form appear here."}</p>{!data?.length && <Button asChild variant="secondary" size="sm" className="mt-4"><Link to="/book">Open booking form</Link></Button>}</div>}
          {rows.map((booking) => <BookingCard key={booking.id} booking={booking} viewOnly={viewOnly} onEdit={setSelectedBooking} onStatus={(id, status) => void onStatus(id, status)} onPayment={(id, status) => void onPayment(id, status)} onAudit={(id) => void onAudit(id)} onPhotos={openPhotos} />)}
        </section>
      </div>
    </main>
  );
}
