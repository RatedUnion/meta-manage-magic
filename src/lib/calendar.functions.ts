import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

const bookingInput = z.object({
  service: z.string().trim().min(1).max(100),
  /** ISO date, e.g. 2026-08-20 */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** 24h time, e.g. 14:30 */
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(10).max(480).default(60),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  notes: z.string().trim().max(500).optional(),
  photos: z.number().int().min(0).max(20).default(0),
  photoPaths: z.array(z.string().max(300)).max(5).default([]),
  ref: z.string().trim().min(3).max(32),
});

export type CalendarResult = {
  scheduled: boolean;
  htmlLink?: string;
  error?: string;
};

export const addBookingToCalendar = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingInput.parse(data))
  .handler(async ({ data }): Promise<CalendarResult> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["GOOGLE_CALENDAR_API_KEY"];
    if (!lovableKey || !connectionKey) {
      return { scheduled: false, error: "Calendar is not connected." };
    }

    // Trinidad & Tobago has no DST — fixed UTC-04:00 offset.
    const start = `${data.date}T${data.time}:00-04:00`;
    const [h, m] = data.time.split(":").map(Number);
    const endMinutes = (h ?? 0) * 60 + (m ?? 0) + data.durationMinutes;
    const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(
      endMinutes % 60,
    ).padStart(2, "0")}`;
    const end = `${data.date}T${endTime}:00-04:00`;

    // Signed photo links (30 days) — only for files inside this booking's own folder.
    const photoLinks: string[] = [];
    const safe = data.photoPaths.filter((p) =>
      new RegExp(`^${data.ref.replace(/[^A-Z0-9-]/gi, "")}/[0-9a-f-]{36}\\.[a-z0-9]{1,5}$`, "i").test(p),
    );
    if (safe.length > 0) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: signed } = await supabaseAdmin.storage
          .from("booking-photos")
          .createSignedUrls(safe, 60 * 60 * 24 * 30);
        for (const s of signed ?? []) if (s.signedUrl) photoLinks.push(s.signedUrl);
      } catch (err) {
        console.error("Photo link signing failed", err);
      }
    }

    const body = {
      summary: `${data.service} — ${data.name} (${data.ref})`,
      description: [
        `Reference: ${data.ref}`,
        `Service: ${data.service}`,
        `Client: ${data.name}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email}`,
        data.photos > 0 ? `Photos attached: ${data.photos}` : null,
        ...photoLinks.map((u, i) => `Photo ${i + 1}: ${u}`),
        data.notes ? `Notes: ${data.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      location: "Trinidad and Tobago",
      start: { dateTime: start, timeZone: "America/Port_of_Spain" },
      end: { dateTime: end, timeZone: "America/Port_of_Spain" },
      attendees: [{ email: data.email, displayName: data.name }],

      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 24 * 60 },
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 15 },
          { method: "email", minutes: 24 * 60 },
        ],
      },
    };

    try {
      const res = await fetch(
        `${GATEWAY_URL}/calendars/primary/events?sendUpdates=all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": connectionKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );


      if (!res.ok) {
        const text = await res.text();
        console.error(`Calendar insert failed [${res.status}]: ${text}`);
        return { scheduled: false, error: `Calendar error ${res.status}` };
      }

      const event = (await res.json()) as { htmlLink?: string };
      return { scheduled: true, htmlLink: event.htmlLink ?? undefined };
    } catch (err) {
      console.error("Calendar insert threw", err);
      return { scheduled: false, error: "Calendar request failed" };
    }
  });
