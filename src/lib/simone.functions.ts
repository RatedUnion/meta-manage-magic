import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callbackInput } from "./simone";

export const listCallbackReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("callback_reminders")
      .select("id,contact_name,phone_number,reason,message,status,reminder_at,source,assistant_name,created_at,handled_at")
      .order("reminder_at", { ascending: true }).limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

export const saveCallbackReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => callbackInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: reminder, error } = await context.supabase.from("callback_reminders").insert({
      contact_name: data.contactName, phone_number: data.phoneNumber,
      reason: data.reason, message: data.message, reminder_at: data.reminderAt,
      source: "manual", created_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return reminder;
  });

export const updateCallbackReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["pending", "handled"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: reminder, error } = await context.supabase.from("callback_reminders").update({
      status: data.status, handled_at: data.status === "handled" ? new Date().toISOString() : null,
    }).eq("id", data.id).select("id").single();
    if (error) throw new Error(error.message);
    return reminder;
  });