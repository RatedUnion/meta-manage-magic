import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import {
  ArrowLeft,
  Banknote,
  Building2,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Globe2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { recordBookingPayment } from "@/lib/bookings.functions";


const paySearchSchema = z.object({
  ref: z.string().max(40).optional(),
  amount: z.coerce.number().positive().max(1_000_000).optional(),
});

export const Route = createFileRoute("/pay")({
  validateSearch: (search: Record<string, unknown>) => paySearchSchema.parse(search),
  component: PayPage,
  head: () => ({
    meta: [
      { title: "Secure payments — Dedicated Ultimatum Appointed Associates" },
      {
        name: "description",
        content:
          "Pay securely by LINX, Visa or American Express, or settle by local and international bank transfer with SWIFT/IBAN details, in TTD, USD, GBP, EUR or CAD.",
      },
      { property: "og:title", content: "Secure payments — Dedicated Ultimatum" },
      {
        property: "og:description",
        content:
          "Card and bank transfer payments for mechanic, electrical, class, delivery and reservation services across Trinidad & Tobago.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const CURRENCIES = [
  { code: "TTD", label: "Trinidad & Tobago Dollar", symbol: "TT$" },
  { code: "USD", label: "United States Dollar", symbol: "US$" },
  { code: "GBP", label: "Pound Sterling", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
] as const;

const SERVICES = [
  "Mobile Mechanic",
  "Electrician",
  "Online Booking Consultation",
  "Online Class",
  "Delivery",
  "Reservation",
];

const FCB_BANK = {
  bank: "First Citizens Bank Limited",
  country: "Trinidad & Tobago",
  account: "Dedicated Ultimatum Appointed Associates",
  number: "003108954",
  type: "Savings (TTD)",
  swift: "FCTTTTPS",
  branch: "San Fernando",
};

const PAYPAL_LINK = "https://paypal.me/unionrated?locale.x=en_US&country.x=TT";

const CARD_BRANDS = [
  { id: "linx", label: "LINX", hint: "Local debit" },
  { id: "visa", label: "Visa", hint: "Local & foreign" },
  { id: "amex", label: "American Express", hint: "Foreign" },
] as const;

const cardSchema = z.object({
  bookingRef: z
    .string()
    .trim()
    .min(3, "Enter the booking reference from your confirmation")
    .max(40)
    .transform((v) => v.toUpperCase()),
  amount: z.coerce.number().positive("Enter an amount greater than zero").max(1_000_000),
  service: z.string().min(1, "Choose what you're paying for"),
  brand: z.string().min(1, "Choose a card type"),
  name: z.string().trim().min(2, "Cardholder name is required").max(100),
  number: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{15,16}$/.test(v), "Enter a valid card number"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be MM/YY"),
  cvv: z.string().regex(/^\d{3,4}$/, "Enter a valid security code"),
  email: z.string().trim().email("Enter a valid email").max(255),
});


function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(`${label} copied`);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            toast.error("Couldn't copy — please select the text manually");
          }
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

const wireSchema = z.object({
  bookingRef: z
    .string()
    .trim()
    .min(3, "Enter the booking reference from your confirmation")
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Booking reference contains invalid characters")
    .transform((v) => v.toUpperCase()),
  email: z.string().trim().email("Enter a valid email").max(255),
  amount: z.coerce.number().positive("Enter the transferred amount").max(1_000_000),
});

function WireForm() {
  const payBooking = useServerFn(recordBookingPayment);
  const [currency, setCurrency] = useState<string>("TTD");
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const symbol = useMemo(
    () => CURRENCIES.find((c) => c.code === currency)?.symbol ?? "",
    [currency],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = wireSchema.safeParse({ bookingRef: reference, email, amount });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the transfer details");
      return;
    }
    setSubmitting(true);
    try {
      const result = await payBooking({
        data: {
          reference: parsed.data.bookingRef,
          email: parsed.data.email,
          amount: parsed.data.amount,
          currency: currency as "TTD" | "USD" | "GBP" | "EUR" | "CAD",
          method: "Bank Transfer",
        },
      });
      if (result.status === "throttled") {
        toast.error("Too many attempts", {
          description: "For security we've paused submissions from this device for a few minutes.",
        });
        return;
      }
      if (result.status === "not_found") {
        toast.error("We couldn't find that booking", {
          description: "Check the reference and use the same email you booked with.",
        });
        return;
      }
      if (result.status === "already_paid") {
        toast.info("A payment is already on that booking", {
          description: result.payment_reference
            ? `Existing payment reference ${result.payment_reference}.`
            : undefined,
        });
        return;
      }
      setConfirmation(result.payment_reference);
      setReference("");
      setEmail("");
      setAmount("");
      toast.success("Wire transfer submitted for approval", {
        description: `Ref ${result.payment_reference} — we verify it against our First Citizens account.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer could not be recorded");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <h4 className="font-semibold tracking-tight">Transfer submitted for approval</h4>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Reference <span className="font-mono font-medium text-foreground">{confirmation}</span>.
          We'll confirm the funds against First Citizens Bank Acc. 003108954 and mark your booking
          paid — usually within one business day.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setConfirmation(null)}>
          Submit another transfer
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h4 className="font-semibold tracking-tight">Already transferred? Confirm it here</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Log your transfer so we can match it on our statement and approve your booking.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="wire-ref">Booking reference</Label>
          <Input
            id="wire-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="DUA-XXXXX"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wire-email">Email on the booking</Label>
          <Input
            id="wire-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wire-currency">Currency transferred</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="wire-currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code} — {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wire-amount">Amount transferred ({symbol})</Label>
          <Input
            id="wire-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit transfer for approval"}
      </Button>
    </form>
  );
}

function BankCard({
  entry,
}: {
  entry: { bank: string; country: string; account: string; number: string; type: string; swift: string; branch: string };
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <h3 className="font-semibold tracking-tight">{entry.bank}</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{entry.country} · {entry.type}</p>
      <Separator className="my-3" />
      <CopyRow label="Account name" value={entry.account} />
      <CopyRow label="Account number (no IBAN)" value={entry.number} />
      <CopyRow label="SWIFT / BIC" value={entry.swift} />
      <p className="mt-2 text-xs text-muted-foreground">{entry.branch}</p>
    </div>
  );
}

function PayPage() {
  const payBooking = useServerFn(recordBookingPayment);
  const search = Route.useSearch();
  const [currency, setCurrency] = useState<string>("TTD");
  const [bookingRef, setBookingRef] = useState(search.ref ?? "");
  const [amount, setAmount] = useState(search.amount != null ? String(search.amount) : "");
  const [service, setService] = useState("");
  const [brand, setBrand] = useState<string>("linx");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<
    { ref: string; amount: string; brand: string; bookingRef: string } | null
  >(null);

  const symbol = useMemo(
    () => CURRENCIES.find((c) => c.code === currency)?.symbol ?? "",
    [currency],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = cardSchema.safeParse({ bookingRef, amount, service, brand, name, number, expiry, cvv, email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your card details");
      return;
    }
    setSubmitting(true);
    const brandLabel = CARD_BRANDS.find((b) => b.id === parsed.data.brand)?.label ?? "Visa";
    try {
      const result = await payBooking({
        data: {
          reference: parsed.data.bookingRef,
          email: parsed.data.email,
          amount: parsed.data.amount,
          currency: currency as "TTD" | "USD" | "GBP" | "EUR" | "CAD",
          method: brandLabel,
        },
      });
      if (result.status === "throttled") {
        toast.error("Too many attempts", {
          description: "For security we've paused payments from this device for a few minutes. No card was charged.",
        });
        return;
      }
      if (result.status === "not_found") {
        toast.error("We couldn't find that booking", {
          description: "Check the reference and use the same email you booked with. No card was charged.",
        });
        return;
      }
      if (result.status === "already_paid") {
        toast.info("A payment is already on that booking", {
          description: result.payment_reference
            ? `Existing payment reference ${result.payment_reference}. No card was charged.`
            : "No card was charged.",
        });
        return;
      }
      setReceipt({
        ref: result.payment_reference,
        amount: `${symbol}${parsed.data.amount.toFixed(2)} ${currency}`,
        brand: brandLabel,
        bookingRef: parsed.data.bookingRef,
      });
      setNumber(""); setCvv(""); setExpiry("");
      toast.success("Payment submitted", {
        description: `Ref ${result.payment_reference} — awaiting confirmation against our First Citizens account.`,
      });

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment could not be recorded");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Lock className="h-3.5 w-3.5 text-primary" /> Secure payment
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Payments</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Settle your invoice</h1>
          <p className="mt-3 text-muted-foreground">
            Pay by LINX, Visa or American Express, or transfer to our First Citizens Bank account.
            All amounts can be quoted in TTD, USD, GBP, EUR or CAD.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Encrypted in transit</span>
            <span className="inline-flex items-center gap-1.5"><Globe2 className="h-4 w-4 text-primary" /> Multi-currency</span>
            <span className="inline-flex items-center gap-1.5"><Banknote className="h-4 w-4 text-primary" /> SWIFT / IBAN supported</span>
          </div>
        </div>

        {receipt ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">Payment submitted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {receipt.brand} · {receipt.amount} · Reference {receipt.ref}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Booking <span className="font-mono">{receipt.bookingRef}</span> is marked
              <span className="font-medium text-foreground"> awaiting confirmation</span>. We confirm it as
              paid once the funds show in our First Citizens Bank account (Acc. 003108954), usually within one
              business day. Keep this reference — quote it when your technician arrives or when you contact us.
            </p>

            <Button className="mt-6" onClick={() => setReceipt(null)}>Make another payment</Button>
          </div>
        ) : (
          <Tabs defaultValue="card" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card">Card</TabsTrigger>
              <TabsTrigger value="bank">Bank transfer</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="mt-6">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bookingref">Booking reference</Label>
                  <Input
                    id="bookingref"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                    placeholder="DUA-XXXXX"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    From your booking confirmation. Don't have one yet?{" "}
                    <Link to="/book" className="underline underline-offset-2">Book a service first</Link>.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">

                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.code} — {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({symbol})</Label>
                    <Input
                      id="amount"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Paying for</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger id="service"><SelectValue placeholder="Select a service" /></SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Card type</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {CARD_BRANDS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBrand(b.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-colors",
                          brand === b.id
                            ? "border-primary bg-primary/5"
                            : "border-border/70 hover:border-primary/50",
                        )}
                      >
                        <CreditCard className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-medium">{b.label}</p>
                        <p className="text-xs text-muted-foreground">{b.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardname">Cardholder name</Label>
                  <Input id="cardname" autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As printed on the card" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardnumber">Card number</Label>
                  <Input
                    id="cardnumber"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={number}
                    onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" autoComplete="cc-exp" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">Security code</Label>
                    <Input id="cvv" inputMode="numeric" autoComplete="cc-csc" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="CVV" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email on the booking</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  <p className="text-xs text-muted-foreground">Use the same email you booked with — we match the payment to your booking.</p>
                </div>


                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Authorising…" : `Pay ${amount ? `${symbol}${amount}` : ""} ${currency}`.trim()}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  <Lock className="mr-1 inline h-3 w-3" />
                  Card details are never stored on this device. Live card processing is activated once the merchant gateway is connected.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="bank" className="mt-6 space-y-8">
              <section className="space-y-4">
                <h2 className="text-lg font-semibold tracking-tight">Bank transfer details</h2>
                <BankCard entry={FCB_BANK} />
              </section>

              <div className="rounded-xl border border-border/70 bg-muted/40 p-5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Before you transfer</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Use your booking reference (DUA-XXXXX) as the payment narrative.</li>
                  <li>Email the transfer confirmation to delegated@live.com so we can release the job.</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="paypal" className="mt-6 space-y-6">
              <div className="rounded-xl border border-border/70 bg-card p-5">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold tracking-tight">Pay with PayPal</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send your payment securely through PayPal. Use your booking reference as the note.
                </p>
                <Separator className="my-4" />
                {PAYPAL_LINK ? (
                  <Button asChild className="w-full sm:w-auto">
                    <a href={PAYPAL_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                      Open PayPal.me <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    PayPal link is not configured yet. Please use the Card or Bank transfer tab, or contact us at delegated@live.com.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
