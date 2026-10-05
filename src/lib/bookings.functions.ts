import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const saveSchema = z.object({
  reference: z.string().min(3),
  service: z.string().min(1),
  booking_date: z.string().min(8),
  booking_time: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional(),
  photo_count: z.number().int().min(0).max(20).default(0),
  photo_paths: z.array(z.string().min(1).max(300)).max(20).default([]),
  calendar_event_url: z.string().url().optional(),
});

/** Public: anyone submitting the booking form can persist their request. */
export const saveBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("bookings").insert({
      reference: data.reference,
      service: data.service,
      booking_date: data.booking_date,
      booking_time: data.booking_time,
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes ?? null,
      photo_count: data.photo_count,
      photo_paths: data.photo_paths,
      calendar_event_url: data.calendar_event_url ?? null,
    });
    if (error) throw new Error(error.message);
    return { saved: true as const };
  });

/** Owner only: full booking history including customer contact details. */
export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "confirmed", "completed", "cancelled"]) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Owner only: manually flip a booking between paid / unpaid / refunded. */
export const updatePaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        payment_status: z.enum(["unpaid", "pending_review", "paid", "refunded"]),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({
        payment_status: data.payment_status,
        paid_at: data.payment_status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Owner only: short-lived signed URLs so staff can view a booking's uploaded photos. */
export const getBookingPhotoUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ paths: z.array(z.string().min(1).max(300)).max(20) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const urls: string[] = [];
    for (const path of data.paths) {
      const { data: signed, error } = await context.supabase.storage
        .from("booking-photos")
        .createSignedUrl(path, 60 * 15);
      if (!error && signed?.signedUrl) urls.push(signed.signedUrl);
    }
    return { urls };
  });

const ALLOWED_CURRENCIES = ["TTD", "USD", "GBP", "EUR", "CAD"] as const;
const ALLOWED_METHODS = ["LINX", "Visa", "American Express", "Bank Transfer", "PayPal"] as const;

const paymentSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Invalid booking reference")
    .transform((v) => v.toUpperCase()),
  email: z.string().trim().toLowerCase().email().max(255),
  amount: z.number().positive().max(1_000_000),
  currency: z.enum(ALLOWED_CURRENCIES),
  method: z.enum(ALLOWED_METHODS),
});

/** Max failed reference/email guesses allowed from one address per window. */
const ATTEMPT_LIMIT = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Public: attaches a completed payment to an existing booking.
 *
 * Security notes:
 * - No card data ever reaches this function; only the payment outcome is recorded.
 * - The caller must know both the booking reference and the email on that booking.
 * - Failed attempts are logged per IP and throttled to stop reference guessing.
 * - The payment reference is generated server-side, never accepted from the client.
 * - A booking that is already paid is never silently overwritten.
 */
export const recordBookingPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => paymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const request = getRequest();
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const since = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString();
    const { count: failures } = await supabaseAdmin
      .from("payment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("succeeded", false)
      .gte("created_at", since);

    if ((failures ?? 0) >= ATTEMPT_LIMIT) {
      return { status: "throttled" as const };
    }

    const logAttempt = async (succeeded: boolean) => {
      await supabaseAdmin
        .from("payment_attempts")
        .insert({ ip, reference: data.reference, succeeded });
    };

    // Look up first so an already-paid booking is never overwritten.
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("bookings")
      .select("id, service, booking_date, booking_time, payment_status, payment_reference")
      .eq("reference", data.reference)
      .ilike("email", data.email)
      .maybeSingle();
    if (lookupError) throw new Error("Payment could not be processed");

    if (!existing) {
      await logAttempt(false);
      return { status: "not_found" as const };
    }

    if (existing.payment_status === "paid" || existing.payment_status === "pending_review") {
      await logAttempt(true);
      return {
        status: "already_paid" as const,
        payment_reference: existing.payment_reference,
      };
    }

    const paymentReference =
      "PAY-" + crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        // Funds are not settled until the owner confirms them against the
        // First Citizens account — never mark a booking paid automatically.
        payment_status: "pending_review",
        payment_amount: data.amount,
        payment_currency: data.currency,
        payment_method: data.method,
        payment_reference: paymentReference,
        paid_at: null,
      })
      .eq("id", existing.id)
      .eq("payment_status", existing.payment_status);
    if (error) throw new Error("Payment could not be processed");

    await logAttempt(true);

    return {
      status: "recorded" as const,
      payment_reference: paymentReference,
      booking: {
        service: existing.service,
        booking_date: existing.booking_date,
        booking_time: existing.booking_time,
      },
    };
  });


