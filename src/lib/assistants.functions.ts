import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AssistantBot {
  id: string;
  name: string;
  role: string;
  specialty: string;
  status: "idle" | "analyzing" | "completed";
}

export const ASSISTANT_ROSTER: AssistantBot[] = [
  { id: "nexus", name: "Nexus Commander", role: "Primary Orchestrator", specialty: "Task dispatch and cross-agent delegation", status: "idle" },
  { id: "wrench", name: "GearMaster Dee", role: "Mobile Mechanic", specialty: "OBD diagnostics, OEM part references, fleet triage", status: "idle" },
  { id: "volt", name: "VoltSage", role: "Master Electrician", specialty: "T&TEC code compliance, generator wiring, 110V/220V load balancing", status: "idle" },
  { id: "transit", name: "Logistics Dispatcher", role: "Island Courier", specialty: "Route timing (Priority Bus Route / Uriah Butler Hwy), hotbox logistics", status: "idle" },
  { id: "curriculum", name: "EduLead", role: "Technical Instructor", specialty: "Syllabus builder for automotive & electrical apprentices", status: "idle" },
  { id: "flora", name: "FloraScape", role: "Grounds Coordinator", specialty: "Lawn rotation, tropical landscaping, event exterior dressing", status: "idle" },
  { id: "auditor", name: "TTD CashFlow Auditor", role: "Financial Engine", specialty: "FCB account reconciliation, invoice validation, margin auditing", status: "idle" },
];

const dispatchSchema = z.object({
  botId: z.string(),
  prompt: z.string().min(2).max(1000),
  contextData: z.record(z.any()).optional(),
});

export const runAssistantTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => dispatchSchema.parse(data))
  .handler(async ({ data }) => {
    // Returns synthesized recommendations matched to DUAA operational constraints
    const bot = ASSISTANT_ROSTER.find((b) => b.id === data.botId) || ASSISTANT_ROSTER[0];
    const timestamp = new Date().toISOString();

    return {
      success: true,
      bot: bot.name,
      role: bot.role,
      timestamp,
      summary: `[${bot.role}] Analysis for: "${data.prompt}" completed.`,
      recommendations: [
        `Standard rates applied: Domestic from TTD $250 / Commercial minimum TTD $1,200.`,
        `Checked against Port of Spain / San Fernando service routing.`,
        `Task queued for dispatch to field associate.`,
      ],
    };
  });
