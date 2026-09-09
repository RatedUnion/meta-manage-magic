import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const FEEDBACK_ASPECTS = [
  { key: "page", label: "Page", hint: "Did every function on the site work as expected?" },
  { key: "layout", label: "Layout", hint: "Was the site clear, readable and easy to move around?" },
  { key: "timing", label: "Timing", hint: "Did we arrive and respond when we said we would?" },
  { key: "affordability", label: "Affordability", hint: "Was the price fair for the work delivered?" },
  { key: "representative", label: "Representative", hint: "How was the technician's conduct and knowledge?" },
  { key: "duration", label: "Duration", hint: "Was the job completed in a reasonable time?" },
  { key: "conclusions", label: "Conclusions", hint: "Was the outcome complete and did it hold up?" },
] as const;

export type AspectKey = (typeof FEEDBACK_ASPECTS)[number]["key"];

const rating = z.number().int().min(1).max(5);

const submitSchema = z.object({
  kind: z.enum(["review", "complaint"]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  service: z.string().trim().max(120).optional(),
  booking_reference: z.string().trim().max(40).optional(),
  comments: z.string().trim().max(2000).optional(),
  ratings: z.object({
    page: rating,
    layout: rating,
    timing: rating,
    affordability: rating,
    representative: rating,
    duration: rating,
    conclusions: rating,
  }),
});

/** Public: any visitor can file a review or a complaint. */
export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const values = Object.values(data.ratings);
    const overall = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    const reference =
      (data.kind === "complaint" ? "CMP-" : "REV-") +
      crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

    const { error } = await supabase.from("feedback").insert({
      reference,
      kind: data.kind,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      service: data.service ?? null,
      booking_reference: data.booking_reference ?? null,
      comments: data.comments ?? null,
      overall,
      rating_page: data.ratings.page,
      rating_layout: data.ratings.layout,
      rating_timing: data.ratings.timing,
      rating_affordability: data.ratings.affordability,
      rating_representative: data.ratings.representative,
      rating_duration: data.ratings.duration,
      rating_conclusions: data.ratings.conclusions,
    });
    if (error) throw new Error("Could not save your feedback. Please try again.");

    return { reference, overall };
  });

/** Owner only. */
export const listFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setFeedbackHandled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), handled: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("feedback")
      .update({ handled: data.handled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { updated: true as const };
  });
