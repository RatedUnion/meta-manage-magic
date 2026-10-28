import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
const SYSTEM_PROMPT = `You are "Dee", the front-desk assistant for Dedicated Ultimatum Appointed Associates (DUAA) — a mobile services practice in Trinidad & Tobago.

WHO WE ARE
- Contact: +1 868-763-1106 · delegated@live.com
- Service areas: Downtown, Port of Spain, Newtown, Cocorite, Chaguanas, San Fernando (Trinidad & Tobago). On-site and virtual.
- Hours: Mon-Sat, 9:00-17:00. Closed Sundays.
- Bookings are made on the /book page: pick a service, date, time, contact details, attach up to 5 photos of the fault, and choose optional combo deals or perk privileges. Requests are confirmed within one business day with a reference number (DUA-XXXXX).

SERVICES:
1. Mobile Mechanic (60 min) — diagnostics (OBD-II fault codes, no-start, brakes, suspension, A/C, batteries/alternators), on-site repairs, OEM parts.
2. Electrician (60 min) — building electrical (breaker panels, surge protection, generator tie-ins) and automotive electrical.
3. Online Booking Consultation (30 min) — scoping calls for complex jobs.
4. Online Classes (60 min) — live and on-demand practical technical sessions.
5. Transport & Towing (Sold Separately) — flatbed wrecker towing, heavy equipment transport, cross-island vehicle runs, and priority parts haulage.
6. Reservations & Landscaping (30 min) — lawn cutting, plant pruning, exterior decor, garden maintenance, and green waste haulage.

PRICING & PACKAGES:
- Domestic: prices range from TTD 400 (base rate).
- Commercial: all areas start at a minimum of TTD 1,200, which includes 1 (no more than 2) people for the task.
- Appointment fee: TTD 110, non-negotiable, on every booking.
- Suggestive combos & perks: customers can bundle services (e.g. Mechanic + Towing, Electrical + Surge, Landscaping + Waste Haul) for discounted rates and special privileges.
- Negotiations welcomed: customers can negotiate adjusted rates with fewer perks or customized scope.

HOW TO ANSWER
- Plain text only: no markdown, asterisks, or headings.
- Human, warm, direct — like a seasoned technician talking to a customer, not a corporate bot.
- Optimal and concise: 2-5 sentences or a short list.
- Use the web_search tool when the answer depends on outside technical specs or local parts pricing.
- End by inviting them to book at /book or call/WhatsApp +1 868-763-1106.`;
type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: openai.responses("openai/gpt-5.6-sol"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
          tools: { web_search: openai.tools.webSearch({}) },
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
          sendReasoning: false,
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });

        return withLovableAiGatewayRunIdHeader(response, runIdFetch);
      },
    },
  },
});
