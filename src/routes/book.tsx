import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, CheckCircle2, Clock, ImagePlus, Images, Mail, Phone, User, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  component: BookPage,
  head: () => ({
    meta: [
      { title: "Book an appointment — Dedicated Ultimatum Appointed Associates" },
      {
        name: "description",
        content:
          "Reserve your slot with Dedicated Ultimatum Appointed Associates — mobile mechanic, electrician, classes, delivery, and reservations across Trinidad & Tobago.",
      },
      { property: "og:title", content: "Book an appointment — Dedicated Ultimatum" },
      {
        property: "og:description",
        content:
          "Choose a service, pick a date and time, and we'll confirm your appointment within one business day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SERVICES = [
  { id: "mechanic", label: "Mobile Mechanic", duration: "60 min" },
  { id: "electrician", label: "Electrician", duration: "60 min" },
  { id: "booking", label: "Online Booking Consultation", duration: "30 min" },
  { id: "class", label: "Online Class", duration: "60 min" },
  { id: "delivery", label: "Delivery Scheduling", duration: "20 min" },
  { id: "reservation", label: "Reservation", duration: "30 min" },
] as const;

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00",
];

const bookingSchema = z.object({
  service: z.string().min(1, "Please choose a service"),
  date: z.date({ required_error: "Please pick a date" }),
  time: z.string().min(1, "Please pick a time"),
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  notes: z.string().trim().max(500).optional(),
});

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

type PhotoItem = { id: string; file: File; url: string };

type Confirmation = {
  ref: string;
  service: string;
  date: Date;
  time: string;
  name: string;
  email: string;
  photos: number;
};


function BookPage() {
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    const accepted: PhotoItem[] = [];
    let rejectedType = 0;
    let rejectedSize = 0;

    for (const file of incoming) {
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        toast.error(`You can attach up to ${MAX_PHOTOS} photos`);
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) { rejectedType++; continue; }
      if (file.size > MAX_PHOTO_BYTES) { rejectedSize++; continue; }
      accepted.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        url: URL.createObjectURL(file),
      });
    }

    if (rejectedType) toast.error("Only JPG, PNG, WEBP or HEIC images are supported");
    if (rejectedSize) toast.error("Each photo must be under 10 MB");
    if (accepted.length) setPhotos((prev) => [...prev, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const selectedService = useMemo(
    () => SERVICES.find((s) => s.id === serviceId),
    [serviceId],
  );

  const disabledDays = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day < today) return true;
    const dow = day.getDay();
    return dow === 0; // closed Sundays
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = bookingSchema.safeParse({
      service: serviceId, date, time, name, email, phone,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      const ref = "DUA-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      setConfirmation({
        ref,
        service: selectedService?.label ?? "",
        date: parsed.data.date,
        time: parsed.data.time,
        name: parsed.data.name,
        email: parsed.data.email,
        photos: photos.length,
      });
      toast.success("Appointment requested", {
        description: `Ref ${ref} — confirmation sent to ${parsed.data.email}.`,
      });
      setSubmitting(false);
    }, 700);
  };

  const reset = () => {
    setConfirmation(null);
    setServiceId(""); setDate(undefined); setTime("");
    setName(""); setEmail(""); setPhone(""); setNotes("");
    setPhotos((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.url)); return []; });
  };


  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <span className="text-sm font-medium">Book an appointment</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {confirmation ? (
          <ConfirmationCard confirmation={confirmation} onReset={reset} />
        ) : (
          <>
            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Booking</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Reserve your slot
              </h1>
              <p className="mt-3 text-muted-foreground">
                Pick a service, choose a date and time, and share your contact details.
                We'll confirm within one business day.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-10">
              {/* Service */}
              <section className="space-y-3">
                <Label>Service</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SERVICES.map((s) => {
                    const active = serviceId === s.id;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setServiceId(s.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition",
                          active
                            ? "border-accent bg-accent/10 shadow-sm"
                            : "border-border bg-card hover:border-accent/60",
                        )}
                      >
                        <div className="font-medium">{s.label}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> {s.duration}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Date + Time */}
              <section className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "EEE, MMM d, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={disabledDays}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">Closed Sundays.</p>
                </div>

                <div className="space-y-3">
                  <Label>Time</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((t) => {
                      const active = time === t;
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setTime(t)}
                          disabled={!date}
                          className={cn(
                            "rounded-md border px-2 py-2 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed",
                            active
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border bg-card hover:border-accent/60",
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" maxLength={255} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 868 555 0100" maxLength={30} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={500} placeholder="Anything we should know ahead of time?" />
                </div>
              </section>

              {/* Photos */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="photos">Photos (optional)</Label>
                  <span className="text-xs text-muted-foreground">{photos.length}/{MAX_PHOTOS}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share photos of the fault — engine bay, error codes, panel, wiring or the area to be worked on.
                  It helps us bring the right parts and tools.
                </p>

                <input
                  ref={fileInputRef}
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => addPhotos(e.target.files)}
                />

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map((p) => (
                    <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary/40">
                      <img src={p.url} alt={`Attached issue photo: ${p.file.name}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        aria-label={`Remove ${p.file.name}`}
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-background/85 text-foreground shadow-sm transition hover:bg-background"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-card text-muted-foreground transition hover:border-accent hover:text-foreground"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Add photo</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP or HEIC · up to 10 MB each.</p>
              </section>


              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <div className="text-sm text-muted-foreground">
                  {selectedService && date && time ? (
                    <span>
                      {selectedService.label} · {format(date, "MMM d")} · {time}
                    </span>
                  ) : (
                    <span>Complete all fields to book.</span>
                  )}
                </div>
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? "Booking…" : "Confirm booking"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function ConfirmationCard({ confirmation, onReset }: { confirmation: Confirmation; onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">You're booked in</h1>
          <p className="text-sm text-muted-foreground">
            Confirmation reference <span className="font-mono text-foreground">{confirmation.ref}</span>
          </p>
        </div>
      </div>

      <dl className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
        <Detail icon={<CalendarIcon className="h-4 w-4" />} label="Service" value={confirmation.service} />
        <Detail
          icon={<Clock className="h-4 w-4" />}
          label="When"
          value={`${format(confirmation.date, "EEE, MMM d, yyyy")} · ${confirmation.time}`}
        />
        <Detail icon={<User className="h-4 w-4" />} label="Name" value={confirmation.name} />
        <Detail icon={<Mail className="h-4 w-4" />} label="Email" value={confirmation.email} />
      </dl>

      <div className="mt-8 rounded-lg border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
        We've sent a confirmation to <span className="text-foreground">{confirmation.email}</span>.
        You'll get a reminder the day before. Need to reschedule? Call{" "}
        <a href="tel:+18687631106" className="text-foreground underline underline-offset-4">
          <Phone className="mr-1 inline h-3.5 w-3.5" />+1 868-763-1106
        </a>
        .
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onReset} variant="outline">Book another</Button>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
