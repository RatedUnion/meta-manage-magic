import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  BadgePercent,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Gift,
  Handshake,
  ImagePlus,
  Images,
  ListChecks,
  Mail,
  Phone,
  Sparkles,
  SquareCheckBig,
  Truck,
  User,
  X,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { addBookingToCalendar } from "@/lib/calendar.functions";
import { saveBooking } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  SERVICES as SERVICE_CATALOG,
  SERVICE_COMBOS,
  OPTIONAL_PERKS,
  type ServiceCombo,
  type ServicePerk,
} from "@/data/services";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  component: BookPage,
  head: () => ({
    meta: [
      { title: "Book an appointment — Dedicated Ultimatum Appointed Associates" },
      {
        name: "description",
        content:
          "Reserve your slot with Dedicated Ultimatum Appointed Associates — mobile mechanic, electrician, transport & towing, classes, and landscaping across Trinidad & Tobago.",
      },
      { property: "og:title", content: "Book an appointment — Dedicated Ultimatum" },
      {
        property: "og:description",
        content: "Select combos, customize perks, or choose itemised services. Non-negotiable appointment fee TTD 110.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/** Non-negotiable appointment fee charged on every booking, in TTD. */
const APPOINTMENT_FEE = 110;

const SERVICES = [
  {
    id: "mechanic",
    slug: "mobile-mechanic",
    label: "Mobile Mechanic",
    duration: "60 min",
    detail: "On-site diagnostics, OEM parts fitting, brakes, battery and oil service. Written report included.",
    price: "Domestic from TTD 400 · Appointment fee TTD 110",
  },
  {
    id: "electrician",
    slug: "electrician",
    label: "Electrician",
    duration: "60 min",
    detail: "Building and automotive electrical: fault finding, safe isolation, circuit installs and surge protection.",
    price: "Domestic from TTD 400 · Appointment fee TTD 110",
  },
  {
    id: "booking",
    slug: "online-booking",
    label: "Online Booking Consultation",
    duration: "30 min",
    detail: "A guided scoping session to plan project milestones, equipment, and crew allocations.",
    price: "Appointment fee TTD 110 (credited to the job)",
  },
  {
    id: "class",
    slug: "online-classes",
    label: "Online Technical Class",
    duration: "60 min",
    detail: "One-to-one virtual masterclasses on auto diagnostics, electrical wiring or workshop safety.",
    price: "From TTD 350 · Appointment fee TTD 110",
  },
  {
    id: "delivery",
    slug: "delivery",
    label: "Transport & Towing (Sold Separately)",
    duration: "45 min slot",
    detail: "Dedicated flatbed wrecker towing, heavy machinery transport, and priority parts haulage.",
    price: "From TTD 450 · Appointment fee TTD 110",
  },
  {
    id: "reservation",
    slug: "reservations",
    label: "Landscaping & Garden Decor",
    duration: "60 min",
    detail: "Lawn cutting, plant pruning, arrangements, plant rentals, grounds maintenance, and green waste haulage.",
    price: "Domestic from TTD 400 · Appointment fee TTD 110",
  },
] as const;

type BuildItem = {
  key: string;
  service: string;
  item: string;
  scope: string;
  turnaround: string;
  rate: string;
  price: number | null;
};

function parsePrice(rate: string): number | null {
  const m = rate.match(/TTD\s*([\d,]+(?:\.\d+)?)/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

const BUILD_ITEMS: BuildItem[] = SERVICE_CATALOG.flatMap((svc) =>
  svc.specs.map((spec) => ({
    key: `${svc.slug}::${spec.item}`,
    service: svc.title,
    item: spec.item,
    scope: spec.scope,
    turnaround: spec.turnaround,
    rate: spec.rate,
    price: parsePrice(spec.rate),
  }))
);

const fmtTTD = (n: number) => `TTD ${n.toLocaleString("en-TT", { maximumFractionDigits: 2 })}`;

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
  notes: z.string().trim().max(1000).optional(),
});

type PhotoItem = { id: string; file: File; url: string };

type Confirmation = {
  ref: string;
  service: string;
  date: Date;
  time: string;
  name: string;
  email: string;
  photos: number;
  items: BuildItem[];
  combo?: ServiceCombo;
  perks: ServicePerk[];
  negotiatePreferred: boolean;
  total: number;
  calendarLink?: string;
  calendarScheduled?: boolean;
};

function BookPage() {
  const [service, setService] = useState<string>("mechanic");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
  const [selectedPerkIds, setSelectedPerkIds] = useState<Set<string>>(new Set());
  const [negotiateRequested, setNegotiateRequested] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentServiceObj = SERVICES.find((s) => s.id === service);
  const currentServiceSlug = currentServiceObj?.slug;

  const relevantCombos = useMemo(() => {
    return SERVICE_COMBOS.filter((c) => !currentServiceSlug || c.serviceSlug === currentServiceSlug);
  }, [currentServiceSlug]);

  const selectedCombo = useMemo(() => {
    return SERVICE_COMBOS.find((c) => c.id === selectedComboId) || null;
  }, [selectedComboId]);

  const selectedPerksList = useMemo(() => {
    return OPTIONAL_PERKS.filter((p) => selectedPerkIds.has(p.id));
  }, [selectedPerkIds]);

  const toggleItem = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePerk = (id: string) => {
    setSelectedPerkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chosenItems = useMemo(
    () => BUILD_ITEMS.filter((i) => selectedKeys.has(i.key)),
    [selectedKeys]
  );

  const buildItemsSubtotal = useMemo(
    () => chosenItems.reduce((acc, i) => acc + (i.price ?? 0), 0),
    [chosenItems]
  );

  const perksSubtotal = useMemo(
    () => selectedPerksList.reduce((acc, p) => acc + p.valueTTD, 0),
    [selectedPerksList]
  );

  const comboTotal = selectedCombo ? selectedCombo.discountedPriceTTD : 0;

  const grandTotal = useMemo(() => {
    return APPOINTMENT_FEE + comboTotal + buildItemsSubtotal + perksSubtotal;
  }, [comboTotal, buildItemsSubtotal, perksSubtotal]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (photos.length + files.length > 5) {
      toast.error("Maximum of 5 photos allowed per booking.");
      return;
    }
    const newItems: PhotoItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newItems]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please pick a date for your appointment.");
      return;
    }
    if (!time) {
      toast.error("Please choose a time slot.");
      return;
    }

    const parseRes = bookingSchema.safeParse({ service, date, time, name, email, phone, notes });
    if (!parseRes.success) {
      toast.error(parseRes.error.errors[0]?.message || "Validation error");
      return;
    }

    setIsSubmitting(true);
    const bookingRef = `DUA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      const photoPaths: string[] = [];
      for (const p of photos) {
        const ext = p.file.name.split(".").pop() || "jpg";
        const path = `${bookingRef}/${Math.random().toString(36).substring(2, 9)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("booking-photos").upload(path, p.file);
        if (!upErr) photoPaths.push(path);
      }

      const notesPayload = [
        notes ? `Client Notes: ${notes}` : null,
        selectedCombo ? `SELECTED COMBO: ${selectedCombo.name} (TTD $${selectedCombo.discountedPriceTTD})` : null,
        selectedPerksList.length ? `PERKS: ${selectedPerksList.map((p) => p.name).join(", ")}` : null,
        chosenItems.length ? `BUILD ITEMS: ${chosenItems.map((i) => `${i.item} (${i.rate})`).join("; ")}` : null,
        negotiateRequested ? "⚠️ CLIENT WELCOMES NEGOTIATIONS / FEWER PERKS FOR LOWER PRICE" : null,
        `ESTIMATED TOTAL: TTD $${grandTotal}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      await saveBooking({
        data: {
          reference: bookingRef,
          service: currentServiceObj?.label || service,
          name,
          email,
          phone,
          booking_date: format(date, "yyyy-MM-dd"),
          booking_time: time,
          notes: notesPayload,
          photo_count: photoPaths.length,
          photo_paths: photoPaths,
        },
      });

      try {
        await addBookingToCalendar({ data: { ref: bookingRef } });
      } catch (calErr) {
        console.warn("Calendar sync failed:", calErr);
      }

      setConfirmation({
        ref: bookingRef,
        service: currentServiceObj?.label || service,
        date,
        time,
        name,
        email,
        photos: photoPaths.length,
        items: chosenItems,
        combo: selectedCombo || undefined,
        perks: selectedPerksList,
        negotiatePreferred: negotiateRequested,
        total: grandTotal,
      });

      toast.success("Appointment reserved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Could not complete booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-primary/20 bg-card shadow-lg">
            <CardHeader className="text-center pb-2">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold">Booking Request Confirmed</CardTitle>
              <CardDescription>Reference: <span className="font-mono font-bold text-foreground">{confirmation.ref}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-muted p-4 rounded-lg">
                <div><span className="text-muted-foreground">Service:</span> <p className="font-semibold">{confirmation.service}</p></div>
                <div><span className="text-muted-foreground">Date & Time:</span> <p className="font-semibold">{format(confirmation.date, "PPP")} at {confirmation.time}</p></div>
                <div><span className="text-muted-foreground">Client:</span> <p className="font-semibold">{confirmation.name}</p></div>
                <div><span className="text-muted-foreground">Photos Attached:</span> <p className="font-semibold">{confirmation.photos}</p></div>
              </div>

              {confirmation.combo && (
                <div className="p-3 bg-primary/10 rounded border border-primary/30">
                  <p className="font-semibold text-primary text-xs uppercase tracking-wide">Selected Combo Package</p>
                  <p className="font-bold text-base">{confirmation.combo.name} — {fmtTTD(confirmation.combo.discountedPriceTTD)}</p>
                  <ul className="text-xs list-disc list-inside mt-1 text-muted-foreground">
                    {confirmation.combo.perksIncluded.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {confirmation.perks.length > 0 && (
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase">Selected Privilege Perks</p>
                  <ul className="text-xs space-y-1 mt-1">
                    {confirmation.perks.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>• {p.name}</span>
                        <span className="font-mono">{fmtTTD(p.valueTTD)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {confirmation.negotiatePreferred && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-600 dark:text-amber-400">
                  <Handshake className="w-4 h-4 inline mr-1" />
                  You indicated openness to negotiate customized scope or fewer perks for budget flexibility. Our technician will review this during consultation.
                </div>
              )}

              <div className="border-t border-border pt-4 flex justify-between items-baseline text-base font-bold">
                <span>Calculated Initial Total:</span>
                <span className="text-xl text-primary font-mono">{fmtTTD(confirmation.total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Includes non-negotiable appointment deposit fee of TTD $110.</p>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button className="w-full" asChild>
                  <Link to="/pay" search={{ ref: confirmation.ref, amount: confirmation.total }}>
                    Proceed to Payment / Approve Handshake
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setConfirmation(null)}>
                  Book Another Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link to="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return Home
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Appointment Booking & Custom Packages</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Domestic from TTD $400 · Commercial min $1,200 · Non-negotiable appointment deposit TTD $110.
              </p>
            </div>
            <Badge variant="outline" className="text-xs py-1 px-3 border-primary/40 text-primary w-fit">
              <Sparkles className="w-3.5 h-3.5 mr-1 inline" /> Suggestive Combos & Perks Available
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Choose Service */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Select Service Category
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SERVICES.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setService(s.id);
                    setSelectedComboId(null);
                  }}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-all",
                    service === s.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/40 bg-card"
                  )}
                >
                  <p className="font-semibold text-sm">{s.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{s.detail}</p>
                  <p className="text-xs font-semibold text-primary mt-2">{s.price}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Step 2: Suggestive Selling Combos & Packages */}
          {relevantCombos.length > 0 && (
            <Card className="border-primary/30 bg-primary/[0.02]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BadgePercent className="w-5 h-5 text-primary" />
                    Special Combo Deals & Privilege Packages
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">Save up to 20%</Badge>
                </div>
                <CardDescription>
                  Bundle diagnostics, transport/towing, or haulage into a single turnkey package.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relevantCombos.map((combo) => {
                  const isSelected = selectedComboId === combo.id;
                  return (
                    <div
                      key={combo.id}
                      onClick={() => setSelectedComboId(isSelected ? null : combo.id)}
                      className={cn(
                        "relative cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary"
                          : "border-border hover:border-primary/40 bg-card"
                      )}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm text-foreground">{combo.name}</h4>
                          <div className="text-right">
                            <span className="text-xs line-through text-muted-foreground font-mono">
                              {fmtTTD(combo.basePriceTTD)}
                            </span>
                            <p className="text-base font-bold text-primary font-mono">
                              {fmtTTD(combo.discountedPriceTTD)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{combo.description}</p>
                        <div className="mt-3 space-y-1">
                          <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Included Perks:</p>
                          {combo.perksIncluded.map((p, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">
                          {isSelected ? "Selected ✓" : "Click to bundle"}
                        </span>
                        {combo.suggestedAddon && (
                          <span className="text-[11px] text-muted-foreground italic">
                            Pairs with: {combo.suggestedAddon}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Privilege Perks Addons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Select Additional Perks & Privileges
              </CardTitle>
              <CardDescription>
                Customize your service with priority response, extended guarantees, or disposal privileges.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OPTIONAL_PERKS.map((perk) => {
                const isChecked = selectedPerkIds.has(perk.id);
                return (
                  <div
                    key={perk.id}
                    onClick={() => togglePerk(perk.id)}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 flex items-start gap-3 transition-colors",
                      isChecked ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40 bg-card"
                    )}
                  >
                    <Checkbox checked={isChecked} onCheckedChange={() => togglePerk(perk.id)} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-xs text-foreground">{perk.name}</p>
                        <span className="text-xs font-mono font-semibold text-primary">+{fmtTTD(perk.valueTTD)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{perk.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Negotiation Toggle */}
          <Card className="border-dashed border-amber-500/40 bg-amber-500/[0.03]">
            <CardContent className="pt-6 flex items-start gap-3">
              <Checkbox
                id="negotiate"
                checked={negotiateRequested}
                onCheckedChange={(c) => setNegotiateRequested(Boolean(c))}
                className="mt-1"
              />
              <div>
                <Label htmlFor="negotiate" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
                  <Handshake className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Welcoming Negotiations (Flexible Budget / Fewer Perks)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Have a specific budget or want to waive non-essential perks? Check this box and our technician will adjust the quotation accordingly during consultation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Schedule & Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Schedule & Client Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1 block">Appointment Date (Mon–Sat)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal text-xs h-10">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date() || d.getDay() === 0}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">Preferred Time Slot</Label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select a time</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="text-xs mt-1" required />
                </div>
                <div>
                  <Label className="text-xs">Email Address</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className="text-xs mt-1" required />
                </div>
                <div>
                  <Label className="text-xs">Mobile / WhatsApp</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 868-XXX-XXXX" className="text-xs mt-1" required />
                </div>
              </div>

              <div>
                <Label className="text-xs">Work Agenda or Location Details</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail your vehicle make, electrical issue, transport pickup point, or garden size..."
                  className="text-xs mt-1"
                  rows={3}
                />
              </div>

              {/* Photos upload */}
              <div>
                <Label className="text-xs block mb-1">Attach Photos (Up to 5 images, max 10MB each)</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photos.length >= 5}
                    className="text-xs"
                  >
                    <ImagePlus className="w-3.5 h-3.5 mr-1" /> Add Photos ({photos.length}/5)
                  </Button>
                  {photos.map((p) => (
                    <div key={p.id} className="relative w-12 h-12 rounded border overflow-hidden">
                      <img src={p.url} alt="upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="absolute top-0 right-0 bg-black/70 text-white p-0.5 rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary & Submit */}
          <Card className="bg-muted/40 border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Non-negotiable Appointment Fee:</span>
                <span className="font-mono">{fmtTTD(APPOINTMENT_FEE)}</span>
              </div>

              {selectedCombo && (
                <div className="flex justify-between text-xs text-foreground">
                  <span>Combo Package ({selectedCombo.name}):</span>
                  <span className="font-mono font-semibold">{fmtTTD(selectedCombo.discountedPriceTTD)}</span>
                </div>
              )}

              {perksSubtotal > 0 && (
                <div className="flex justify-between text-xs text-foreground">
                  <span>Selected Privilege Perks:</span>
                  <span className="font-mono font-semibold">+{fmtTTD(perksSubtotal)}</span>
                </div>
              )}

              {buildItemsSubtotal > 0 && (
                <div className="flex justify-between text-xs text-foreground">
                  <span>Itemised Build Specs:</span>
                  <span className="font-mono font-semibold">+{fmtTTD(buildItemsSubtotal)}</span>
                </div>
              )}

              <div className="border-t border-border pt-3 flex justify-between items-baseline font-bold text-base text-foreground">
                <span>Calculated Initial Amount:</span>
                <span className="text-xl text-primary font-mono">{fmtTTD(grandTotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Domestic jobs start at $400 TTD. Commercial minimum $1,200 TTD. Final scope is verified with you before work starts.
              </p>

              <Button type="submit" size="lg" className="w-full text-sm font-semibold mt-4" disabled={isSubmitting}>
                {isSubmitting ? "Locking in Slot & Uploading..." : "Confirm Booking & Proceed to Handshake"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
