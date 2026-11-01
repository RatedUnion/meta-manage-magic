import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

// Only the booking reference is accepted from the browser. Every other detail
// (attendee email, notes, photos) is loaded from the saved booking row, and each
// booking can trigger at most one invitation shortly after it was created.
const bookingInput = z.object({
  ref: z.string().trim().regex(/^DUA-[A-Z0-9]{5}$/),
});
const INVITE_WINDOW_MS = 15 * 60 * 1000;
const DURATION_MINUTES = 60;

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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("id, reference, service, booking_date, booking_time, name, email, phone, notes, photo_paths, calendar_event_url, created_at")
      .eq("reference", data.ref)
      .maybeSingle();
    if (
      !booking ||
      booking.calendar_event_url ||
      Date.now() - new Date(booking.created_at).getTime() > INVITE_WINDOW_MS
    ) {
      return { scheduled: false, error: "Booking not eligible for calendar sync." };
    }
    // Claim the booking first so the invitation can only be sent once.
    const { data: claimed } = await supabaseAdmin
      .from("bookings")
      .update({ calendar_event_url: "pending" })
      .eq("id", booking.id)
      .is("calendar_event_url", null)
      .select("id");
    if (!claimed?.length) return { scheduled: false, error: "Already scheduled." };

    const ev = {
      ref: booking.reference,
      service: booking.service,
      date: booking.booking_date,
      time: booking.booking_time.slice(0, 5),
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      notes: booking.notes ? booking.notes.slice(0, 500) : undefined,
      photoPaths: booking.photo_paths ?? [],
    };

    // Trinidad & Tobago has no DST — fixed UTC-04:00 offset.
    const start = `${ev.date}T${ev.time}:00-04:00`;
    const [h, m] = ev.time.split(":").map(Number);
    const endMinutes = (h ?? 0) * 60 + (m ?? 0) + DURATION_MINUTES;
    const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(
      endMinutes % 60,
    ).padStart(2, "0")}`;
    const end = `${ev.date}T${endTime}:00-04:00`;

    // Signed photo links (30 days) — only for files inside this booking's own folder.
    const photoLinks: string[] = [];
    const safe = ev.photoPaths.filter((p) =>
      new RegExp(`^${ev.ref.replace(/[^A-Z0-9-]/gi, "")}/[0-9a-f-]{36}\\.[a-z0-9]{1,5}$`, "i").test(p),
    );
    if (safe.length > 0) {
      try {
        const { data: signed } = await supabaseAdmin.storage
          .from("booking-photos")
          .createSignedUrls(safe, 60 * 60 * 24 * 30);
        for (const s of signed ?? []) if (s.signedUrl) photoLinks.push(s.signedUrl);
      } catch (err) {
        console.error("Photo link signing failed", err);
      }
    }

    const body = {
      summary: `${ev.service} — ${ev.name} (${ev.ref})`,
      description: [
        `Reference: ${ev.ref}`,
        `Service: ${ev.service}`,
        `Client: ${ev.name}`,
        `Phone: ${ev.phone}`,
        `Email: ${ev.email}`,
        photoLinks.length > 0 ? `Photos attached: ${photoLinks.length}` : null,
        ...photoLinks.map((u, i) => `Photo ${i + 1}: ${u}`),
        ev.notes ? `Notes: ${ev.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      location: "Trinidad and Tobago",
      start: { dateTime: start, timeZone: "America/Port_of_Spain" },
      end: { dateTime: end, timeZone: "America/Port_of_Spain" },
      attendees: [{ email: ev.email, displayName: ev.name }],

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
      await supabaseAdmin
        .from("bookings")
        .update({ calendar_event_url: event.htmlLink ?? "scheduled" })
        .eq("id", booking.id);
      return { scheduled: true, htmlLink: event.htmlLink ?? undefined };
    } catch (err) {
      console.error("Calendar insert threw", err);
      return { scheduled: false, error: "Calendar request failed" };
    }
  });
