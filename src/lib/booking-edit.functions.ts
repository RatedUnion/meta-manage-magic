import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const updateBookingDetailsSchema = z.object({
  id: z.string().uuid(),
  service: z.string().trim().min(1).max(160),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid booking date"),
  booking_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid booking time"),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  notes: z.string().trim().max(1000).nullable(),
});

/** Owner-only editing for booking details. Status, payment, reference and photos are unchanged. */
export const updateBookingDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateBookingDetailsSchema.parse(input))
  .handler(async ({ context, data }) => {
    const parsedDate = new Date(`${data.booking_date}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== data.booking_date) {
      throw new Error("Enter a real calendar date.");
    }

    const { data: updated, error } = await context.supabase
      .from("bookings")
      .update({
        service: data.service,
        booking_date: data.booking_date,
        booking_time: data.booking_time,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes || null,
      })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Booking not found or could not be updated.");
    return { ok: true as const };
  });
