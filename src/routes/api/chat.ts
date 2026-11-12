import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, streamText, type UIMessage } from "ai";
import { kimiFallbackAnswer } from "@/lib/kimi-fallback";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";


const SYSTEM_PROMPT = `You are "Kimi AI", the intelligent front-desk and booking assistant for Dedicated Ultimatum Appointed Associates (DUAA) in Trinidad & Tobago.

==================================================
CRITICAL LIVE UPDATE & PRICING LEDGER (OCTOBER 2026):
Whenever answering pricing questions, enforce these latest verified rules:
1. DOMESTIC BASE RATE: Starts from TTD 400 (supersedes all older $250 references).
2. COMMERCIAL BASE RATE: Minimum TTD 1,200 (includes 1–2 technicians).
3. APPOINTMENT FEE: TTD 110 non-negotiable fee applies to all bookings.
4. TRANSPORT & TOWING: Sold separately from mechanical repair (flatbed wrecker from $450, cross-island haulage from $750). Never quote towing as included in a basic mechanic diagnostic.
5. PACKAGES & PERKS: Suggestive selling and combos (e.g. Mechanic + Towing, Electrical + Surge) are welcomed with perk privileges. Open negotiations welcomed with adjusted perks.
==================================================

WHO WE ARE & REACH:
- Contact: +1 868-763-1106 · delegated@live.com
- Service areas: Downtown, Port of Spain, Newtown, Cocorite, Chaguanas, San Fernando (Trinidad & Tobago). On-site and virtual.
- Hours: Mon-Sat, 9:00-17:00. Closed Sundays.
- Bookings: Completed at /book with up to 5 photos of the fault and reference code DUA-XXXXX.

SERVICES CATALOG:
1. Mobile Mechanic — OBD-II fault codes, no-start, brakes, suspension, A/C, batteries/alternators, on-site repairs, OEM parts.
2. Electrician — building electrical (breaker panels, surge protection, generator tie-ins) and automotive electrical.
3. Online Consultation — scoping calls for complex jobs.
4. Online Classes — live and on-demand practical technical sessions.
5. Transport & Towing (Sold Separately) — flatbed wrecker towing, heavy equipment transport, cross-island vehicle runs.
6. Reservations & Landscaping — lawn cutting, plant pruning, exterior decor, garden maintenance, green waste haulage.

HOW TO ANSWER:
- Style: Warm, direct, seasoned technician tone. Plain text only (no asterisks or markdown headings). Keep answers to 2-5 concise sentences or bullet lines.
- Always close by inviting the customer to book at /book or call/WhatsApp +1 868-763-1106.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Kimi AI is not configured." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: { messages?: UIMessage[] };
        try {
          body = (await request.json()) as { messages?: UIMessage[] };
        } catch {
          return new Response(JSON.stringify({ error: "Invalid request." }), { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return new Response(JSON.stringify({ error: "No messages provided." }), { status: 400 });
        }

        const gateway = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const openai = createOpenAI({
          apiKey,
          baseURL: "https://ai.gateway.lovable.dev/v1",
          fetch: gateway.fetch,
        });

        const last = messages[messages.length - 1];
        const lastText = (Array.isArray(last?.parts) ? last.parts : [])
          .map((p) => (p && (p as { type?: string }).type === "text" ? (p as { text?: string }).text ?? "" : ""))
          .join(" ");
        const modelMessages = await convertToModelMessages(messages).catch(() => null);

        const stream = createUIMessageStream({
          execute: async ({ writer }) => {
            const id = "kimi-text";
            let started = false;
            let failed = !modelMessages;
            if (modelMessages) {
              try {
                const result = streamText({ model: openai.chat("google/gemini-2.5-flash"), system: SYSTEM_PROMPT, messages: modelMessages });
                for await (const part of result.fullStream) {
                  if (part.type === "error") { failed = true; console.error("kimi", part.error); break; }
                  if (part.type === "text-delta") {
                    if (!started) { writer.write({ type: "text-start", id }); started = true; }
                    writer.write({ type: "text-delta", id, delta: part.text });
                  }
                }
              } catch (e) { console.error("kimi", e); failed = true; }
            }
            if (failed && !started) {
              writer.write({ type: "text-start", id });
              writer.write({ type: "text-delta", id, delta: kimiFallbackAnswer(lastText) });
              started = true;
            }
            if (started) writer.write({ type: "text-end", id });
          },
        });
        return withLovableAiGatewayRunIdHeader(createUIMessageStreamResponse({ stream }), gateway);
      },
    },
  },
});
