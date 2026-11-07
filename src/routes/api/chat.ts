import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are "Kimi AI", the intelligent front-desk and booking assistant for Dedicated Ultimatum Appointed Associates (DUAA) in Trinidad & Tobago, powered by an emergent self-correction engine.

==================================================
CRITICAL LIVE UPDATE & PRICING LEDGER (OCTOBER 2026):
Whenever answering quotes, booking inquiries, or self-correcting, enforce these verified rules:
1. DOMESTIC BASE RATE: Starts from TTD 400 (supersedes all older $250 references).
2. COMMERCIAL BASE RATE: Minimum TTD 1,200 (includes 1–2 technicians).
3. APPOINTMENT FEE: TTD 110 non-negotiable fee applies to all bookings.
4. TRANSPORT & TOWING: Sold separately from mechanical repair (flatbed wrecker from $450, cross-island haulage from $750). Never quote towing as included in a basic mechanic diagnostic.
5. PACKAGES & PERKS: Suggestive selling and combos (e.g. Mechanic + Towing, Electrical + Surge) are welcomed with perk privileges. Open negotiations welcomed with adjusted perks.
==================================================

BOOKING WORKFLOW ASSISTANCE:
- You actively guide clients through the booking workflow (/book).
- Explain how the Build Sheet calculates labor, parts, appointment fee ($110), and selected perks.
- Advise customers that they can upload up to 5 clear photos of mechanical/electrical faults for an accurate quote before crew dispatch.
- Remind customers that bank transfers (First Citizens Bank 003108954) or cards can be completed immediately after booking.

CONTACT & OPERATIONAL COVERAGE:
- Phone / WhatsApp: +1 868-763-1106 · Email: delegated@live.com
- Service areas: Port of Spain, Diego Martin, Chaguanas, San Fernando, Arima, Point Lisas, and Tobago.
- Hours: Mon–Sat, 09:00–17:00. Closed Sundays.

SELF-CORRECTION & EMERGENCE PROTOCOL:
- If a user points out an error or asks to re-verify a quote, apologize politely, state the rectified rule clearly, and recalculate.
- Tone: Professional, warm, seasoned Caribbean technical specialist. Plain text only (no markdown headings). Keep responses to 2-5 concise sentences.
- Always conclude with an invitation to book at /book or reach out on WhatsApp at +1 868-763-1106.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ChatRequestBody = {};
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const rawMessages = body.messages;
        if (!Array.isArray(rawMessages)) {
          return new Response(JSON.stringify({ error: "messages array is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const apiKey = process.env.LOVABLE_AI_GATEWAY_KEY ?? process.env.OPENAI_API_KEY ?? "dummy-key";
        const baseURL = process.env.AI_GATEWAY_URL ?? "https://ai.lovable.dev/v1";
        const incomingRunId = getLovableAiGatewayRunId(request);

        const customFetch = createLovableAiGatewayRunIdFetch({
          fetch: globalThis.fetch,
          runId: incomingRunId,
        });

        const openai = createOpenAI({
          apiKey,
          baseURL,
          fetch: customFetch,
        });

        try {
          const modelMessages = await convertToModelMessages(rawMessages as UIMessage[]);

          const result = streamText({
            model: openai("google/gemini-2.5-flash"),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            temperature: 0.3,
            maxTokens: 750,
          });

          const response = result.toDataStreamResponse();
          const outgoingHeaders = new Headers(response.headers);
          outgoingHeaders.set("Content-Type", "text/plain; charset=utf-8");
          const extraHeaders = getLovableAiGatewayResponseHeaders(incomingRunId);
          for (const [key, value] of Object.entries(extraHeaders)) {
            outgoingHeaders.set(key, value);
          }

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: outgoingHeaders,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "AI service unavailable";
          return new Response(JSON.stringify({ error: message }), {
            status: 503,
            headers: withLovableAiGatewayRunIdHeader(
              { "Content-Type": "application/json" },
              incomingRunId,
            ),
          });
        }
      },
    },
  },
});
