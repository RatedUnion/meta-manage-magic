import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CallRecord {
  id: string;
  contactName: string;
  phoneNumber: string;
  direction: "inbound" | "outbound";
  durationSeconds: number;
  status: "completed" | "in-progress" | "missed";
  timestamp: string;
  sentiment: "positive" | "neutral" | "urgent";
  summary: string;
  transcript: Array<{ speaker: "Agent" | "Customer"; text: string }>;
  audioRecordingUrl?: string;
}

export interface SmsMessage {
  id: string;
  recipientPhone: string;
  recipientName: string;
  messageText: string;
  status: "sent" | "delivered" | "failed";
  timestamp: string;
  campaignTag?: string;
}

// Initial in-memory mock state for call records
const DEMO_CALL_RECORDS: CallRecord[] = [
  {
    id: "call-1",
    contactName: "Marcus Hernandez",
    phoneNumber: "+1 868-682-4192",
    direction: "inbound",
    durationSeconds: 142,
    status: "completed",
    timestamp: "Today at 10:14 AM",
    sentiment: "positive",
    summary: "Customer confirmed domestic alternator replacement. Quoted base TTD $400 + $110 fee.",
    transcript: [
      { speaker: "Customer", text: "Good morning, my battery isn't holding charge in San Fernando." },
      { speaker: "Agent", text: "Good morning! Dee from DUAA here. Domestic mobile diagnostics start from TTD $400 plus our standard $110 appointment fee." },
      { speaker: "Customer", text: "Understood. Can we book for tomorrow afternoon?" },
      { speaker: "Agent", text: "Certainly. Booking confirmed for 1:30 PM tomorrow." },
    ],
  },
  {
    id: "call-2",
    contactName: "Point Lisas Industrial Supplies",
    phoneNumber: "+1 868-744-8831",
    direction: "outbound",
    durationSeconds: 215,
    status: "completed",
    timestamp: "Yesterday at 3:45 PM",
    sentiment: "urgent",
    summary: "Commercial backup generator transfer switch quarterly inspection reminder.",
    transcript: [
      { speaker: "Agent", text: "Calling from DUAA regarding your facility emergency transfer switch inspection." },
      { speaker: "Customer", text: "Yes, we need a 2-man crew on site before rainy season peak." },
      { speaker: "Agent", text: "Confirmed. Commercial rates start at minimal TTD $1,200 with 2 technicians included." },
    ],
  },
];

const DEMO_SMS_MESSAGES: SmsMessage[] = [
  {
    id: "sms-1",
    recipientPhone: "+1 868-763-1106",
    recipientName: "Field Unit Alpha",
    messageText: "Dispatched to Couva: Domestic brake check & OBD-II scan. Reference DUA-84192.",
    status: "delivered",
    timestamp: "Today at 09:30 AM",
    campaignTag: "Dispatch",
  },
];

export const initiateVoiceCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        phoneNumber: z.string().min(7, "Valid phone number required"),
        contactName: z.string().optional(),
        campaignContext: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    // Integration Hook: Twilio Voice / Retell API Webhook Trigger
    const newCall: CallRecord = {
      id: `call-${Date.now()}`,
      contactName: data.contactName || "Direct Call",
      phoneNumber: data.phoneNumber,
      direction: "outbound",
      durationSeconds: 45,
      status: "completed",
      timestamp: "Just now",
      sentiment: "positive",
      summary: `Automated call to ${data.phoneNumber}. Campaign context: ${data.campaignContext || "Direct dial"}.`,
      transcript: [
        { speaker: "Agent", text: `Hello, this is Dee from Dedicated Ultimatum Appointed Associates.` },
        { speaker: "Customer", text: `Thanks for following up on my booking inquiry.` },
      ],
    };

    DEMO_CALL_RECORDS.unshift(newCall);
    return { success: true, callId: newCall.id, call: newCall };
  });

export const sendSmsNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        recipientPhone: z.string().min(7, "Valid phone number required"),
        recipientName: z.string().optional(),
        messageText: z.string().min(1, "Message text cannot be empty"),
        campaignTag: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    // Integration Hook: Twilio Programmable SMS API Trigger
    const newSms: SmsMessage = {
      id: `sms-${Date.now()}`,
      recipientPhone: data.recipientPhone,
      recipientName: data.recipientName || "Customer",
      messageText: data.messageText,
      status: "delivered",
      timestamp: "Just now",
      campaignTag: data.campaignTag || "Manual",
    };

    DEMO_SMS_MESSAGES.unshift(newSms);
    return { success: true, sms: newSms };
  });

export const getCallAndSmsLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return {
      calls: DEMO_CALL_RECORDS,
      sms: DEMO_SMS_MESSAGES,
    };
  });
