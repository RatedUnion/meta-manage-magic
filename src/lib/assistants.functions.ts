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

/** Returns authorization for the signed-in user; UI visibility is not the security boundary. */
export const getRosterAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { canManage: !error && Boolean(isAdmin), userId: context.userId };
  });

export const runAssistantTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => dispatchSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Owner/admin authorization is enforced server-side, not just by hiding UI.
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      throw new Error("Access restricted: owner/admin privileges are required.");
    }

    const bot = ASSISTANT_ROSTER.find((item) => item.id === data.botId) ?? ASSISTANT_ROSTER[0];
    const contextData = data.contextData ?? {};
    const rawRoster = contextData["roster"];
    const roster = Array.isArray(rawRoster) ? rawRoster as Array<Record<string, unknown>> : [];
    const task = typeof contextData["task"] === "string" ? contextData["task"] : data.prompt;
    const taskTerms = task.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
    const ranked = roster.map((member) => {
      const searchable = [member["name"], member["role"], member["specialty"], member["area"], member["serviceFit"]]
        .filter((value): value is string => typeof value === "string")
        .join(" ")
        .toLowerCase();
      const status = typeof member["status"] === "string" ? member["status"] : "Unknown";
      const load = typeof member["projectedLoad"] === "number" ? member["projectedLoad"] : 0;
      const fit = taskTerms.reduce((score, term) => score + (searchable.includes(term) ? 1 : 0), 0);
      return { member, score: fit * 4 + (status === "Available" ? 3 : status === "On-Call" ? 2 : 0) - load };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    const recommendations = ranked.length
      ? ranked.map(({ member }, index) => {
          const name = typeof member["name"] === "string" ? member["name"] : "Unnamed crew";
          const role = typeof member["role"] === "string" ? member["role"] : "role not specified";
          const area = typeof member["area"] === "string" ? member["area"] : "coverage not specified";
          const status = typeof member["status"] === "string" ? member["status"] : "Unknown";
          const load = typeof member["projectedLoad"] === "number" ? member["projectedLoad"] : 0;
          return `${index === 0 ? "Top suggested match" : "Alternative"}: ${name} (${role}); coverage: ${area}; status: ${status}; projected task load: ${load}. Confirm availability before dispatch.`;
        })
      : ["No roster context was provided. Review task requirements and confirm crew availability manually."];

    return {
      success: true,
      bot: bot.name,
      role: bot.role,
      timestamp: new Date().toISOString(),
      summary: `[${bot.role}] Task-specific roster projection for: "${task}". Suggestions are advisory and do not change the roster or dispatch crew.`,
      recommendations,
    };
  });
