import { z } from "zod";

export const BUSINESS_PHONE = "+18687631106";
export const BUSINESS_PHONE_LABEL = "+1 (868) 763-1106";
export const SUPPORT_NAME = "Simone";

export const callbackInput = z.object({
  contactName: z.string().trim().min(1).max(120),
  phoneNumber: z.string().transform((value) => value.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Use an international number beginning with +")),
  reason: z.enum(["busy", "no-answer", "sms"]),
  message: z.string().trim().max(1600),
  reminderAt: z.string().datetime({ offset: true }),
});

export type CallbackInput = z.input<typeof callbackInput>;
export type CallbackReminder = {
  id: string;
  contact_name: string;
  phone_number: string;
  reason: "busy" | "no-answer" | "sms";
  message: string;
  status: "pending" | "handled";
  reminder_at: string;
  source: "manual" | "twilio";
  assistant_name: string;
  created_at: string;
  handled_at: string | null;
};

export const SIMONE_GREETING = `Hello, I'm ${SUPPORT_NAME}, DUAA's automated support assistant. Our representative is unavailable. Please leave your name, callback number and a brief message. For direct contact, call ${BUSINESS_PHONE_LABEL}.`;