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
      .object({ id: z.string().uuid(), payment_status: z.enum(["unpaid", "paid", "refunded"]) })
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

const paymentSchema = z.object({
  reference: z.string().trim().min(3).max(40),
  email: z.string().trim().email(),
  amount: z.number().positive().max(1_000_000),
  currency: z.string().min(3).max(3),
  method: z.string().min(2).max(40),
  payment_reference: z.string().min(3).max(40),
});

/**
 * Public: attaches a completed payment to an existing booking.
 * The caller must know both the booking reference and the email on that booking.
 */
export const recordBookingPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => paymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .update({
        payment_status: "paid",
        payment_amount: data.amount,
        payment_currency: data.currency,
        payment_method: data.method,
        payment_reference: data.payment_reference,
        paid_at: new Date().toISOString(),
      })
      .eq("reference", data.reference.toUpperCase())
      .ilike("email", data.email)
      .select("id, service, booking_date, booking_time");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      return { matched: false as const };
    }
    return { matched: true as const, booking: rows[0]! };
  });

