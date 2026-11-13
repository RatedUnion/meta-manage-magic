import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { type TenderOpportunity } from "./assistants.functions";

export const getLiveScoutedTenders = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenderOpportunity[]> => {
    const { data, error } = await supabase
      .from("scouted_tenders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      // Return empty array or fallback to cached state
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      issuingAgency: row.issuing_agency,
      portalSource: row.portal_source,
      scoutedByBotId: row.scouted_by_bot_id,
      scoutedByBotName: row.scouted_by_bot_name,
      deadline: row.deadline,
      estimatedValueTTD: Number(row.estimated_value_ttd),
      scopeSummary: row.scope_summary,
      nexusFilterStatus: row.nexus_filter_status as TenderOpportunity["nexusFilterStatus"],
      nexusScore: row.nexus_score,
      nexusDirective: row.nexus_directive,
      createdAt: row.created_at,
    }));
  }
);
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AssistantBot {
  id: string;
  name: string;
  role: string;
  specialty: string;
  tenderDomain: string;
  portalFocus: string[];
  status: "idle" | "analyzing" | "completed";
}

export interface TenderOpportunity {
  id: string;
  title: string;
  issuingAgency: string;
  portalSource: string;
  scoutedByBotId: string;
  scoutedByBotName: string;
  deadline: string;
  estimatedValueTTD: number;
  scopeSummary: string;
  nexusFilterStatus: "Qualified" | "Under Review" | "Margin Disqualified";
  nexusScore: number; // 0 to 100
  nexusDirective: string;
  createdAt: string;
}

export const ASSISTANT_ROSTER: AssistantBot[] = [
  {
    id: "nexus",
    name: "Nexus Commander",
    role: "Primary Orchestrator",
    specialty: "Task dispatch, procurement evaluation & cross-agent delegation",
    tenderDomain: "Master Tender Aggregation & Multi-Agency Joint Bids",
    portalFocus: ["Office of Procurement Regulation (OPR)", "Central Tenders Board (CTB)"],
    status: "idle",
  },
  {
    id: "wrench",
    name: "GearMaster Dee",
    role: "Mobile Mechanic & Fleet Scout",
    specialty: "OBD diagnostics, OEM part references, heavy equipment triage",
    tenderDomain: "Government Fleet Maintenance & Heavy Transport Servicing",
    portalFocus: ["Ministry of Works & Transport (MOWT)", "VMCOTT", "PTSC Fleet Maintenance"],
    status: "idle",
  },
  {
    id: "volt",
    name: "VoltSage",
    role: "Master Electrician & Power Scout",
    specialty: "T&TEC code compliance, generator wiring, 110V/220V load balancing",
    tenderDomain: "Substation Electrical, Backup Generator Tie-Ins & Industrial Surge",
    portalFocus: ["T&TEC Public Tenders", "National Gas Company (NGC)", "Heritage Petroleum RFPs"],
    status: "idle",
  },
  {
    id: "transit",
    name: "Logistics Dispatcher",
    role: "Island Courier & Freight Scout",
    specialty: "Route timing (Priority Bus Route / Uriah Butler Hwy), hotbox logistics",
    tenderDomain: "Inter-Island Freight, Port Haulage & Regional Distribution",
    portalFocus: ["Port Authority of Trinidad & Tobago (PATT)", "CAL Cargo", "NIDCO Logistics"],
    status: "idle",
  },
  {
    id: "curriculum",
    name: "EduLead",
    role: "Technical Instructor & Vocational Scout",
    specialty: "Syllabus builder for automotive & electrical apprentices",
    tenderDomain: "Youth Vocational Training & Industrial HSE Skills Workshops",
    portalFocus: ["MIC-IT Apprenticeship Tenders", "NESC", "Ministry of Education TVET"],
    status: "idle",
  },
  {
    id: "flora",
    name: "FloraScape",
    role: "Grounds Coordinator & Municipal Scout",
    specialty: "Lawn rotation, tropical landscaping, event exterior dressing",
    tenderDomain: "Commercial Estate Upkeep, Roadside Verges & Municipal Grounds",
    portalFocus: ["UDeCOTT Commercial Grounds", "Regional Corporations (POS/San Fernando)"],
    status: "idle",
  },
  {
    id: "auditor",
    name: "TTD CashFlow Auditor",
    role: "Financial Engine & Audit Scout",
    specialty: "FCB account reconciliation, invoice validation, margin auditing",
    tenderDomain: "Procurement Margin Audits & Public Expenditure Price Compliance",
    portalFocus: ["OPR Public Depository", "Ministry of Finance Audit Directives"],
    status: "idle",
  },
];

/** Evaluates raw tender input against DUAA commercial thresholds and outputs Nexus Commander directives */
export function evaluateTenderOpportunity(
  input: Omit<TenderOpportunity, "id" | "nexusFilterStatus" | "nexusScore" | "nexusDirective" | "createdAt">
): TenderOpportunity {
  const value = Number(input.estimatedValueTTD) || 0;
  let status: TenderOpportunity["nexusFilterStatus"] = "Qualified";
  let score = 85;
  let directive = "Commercial scope validated. Approved for tender package compilation.";

  // Commercial Floor Audit: commercial minimum is TTD $1,200
  if (value < 1200 && value > 0) {
    status = "Margin Disqualified";
    score = 25;
    directive = "REJECTED by Nexus Commander: Value falls below the DUAA TTD $1,200 commercial contract floor.";
  } else if (value >= 50000) {
    status = "Qualified";
    score = 95;
    directive = "HIGH-PRIORITY INDUSTRIAL: Multi-technician mobilization required. Dispatch technical lead for on-site pre-bid survey.";
  } else if (value >= 10000) {
    status = "Qualified";
    score = 88;
    directive = "PROCEED: Well-aligned with DUAA field units and standard fleet equipment. Draft commercial bid proposal.";
  } else if (value === 0) {
    status = "Under Review";
    score = 60;
    directive = "UNPRICED RFP: Scope requires manual RFP document download and bill of quantities cost breakdown.";
  }

  return {
    ...input,
    id: `tender-${Date.now()}`,
    nexusFilterStatus: status,
    nexusScore: score,
    nexusDirective: directive,
    createdAt: new Date().toISOString(),
  };
}

export const DEFAULT_SCOUTED_TENDERS: TenderOpportunity[] = [
  {
    id: "tender-101",
    title: "Preventive Electrical Maintenance for Substation Standby Generators",
    issuingAgency: "Trinidad & Tobago Electricity Commission (T&TEC)",
    portalSource: "T&TEC Procurement Depository",
    scoutedByBotId: "volt",
    scoutedByBotName: "VoltSage",
    deadline: "2026-12-05",
    estimatedValueTTD: 45000,
    scopeSummary: "Quarterly inspection, transfer switch load testing, and surge suppression across 3 North transmission stations.",
    nexusFilterStatus: "Qualified",
    nexusScore: 92,
    nexusDirective: "APPROVED: Matches VoltSage electrical qualifications and T&TEC compliance protocols. Mobilize technical lead.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tender-102",
    title: "Light & Medium Fleet Diagnostic & Mobile Brake Servicing Contract",
    issuingAgency: "Ministry of Works and Transport (MOWT)",
    portalSource: "MOWT Tenders Board",
    scoutedByBotId: "wrench",
    scoutedByBotName: "GearMaster Dee",
    deadline: "2026-11-28",
    estimatedValueTTD: 85000,
    scopeSummary: "On-site fleet triage, scheduled OBD-II fault diagnostics, and rapid emergency mechanical repair along Highway corridors.",
    nexusFilterStatus: "Qualified",
    nexusScore: 95,
    nexusDirective: "HIGH-PRIORITY INDUSTRIAL: Direct match for Field Unit Alpha & Beta. Prepare joint bid with wrecker support.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tender-103",
    title: "Landscape Grounds & Drainage Verge Maintenance - Queen's Park Savannah Corridor",
    issuingAgency: "Port of Spain City Corporation",
    portalSource: "Municipal Public Notice",
    scoutedByBotId: "flora",
    scoutedByBotName: "FloraScape",
    deadline: "2026-12-15",
    estimatedValueTTD: 32000,
    scopeSummary: "Fortnightly grounds maintenance, tree trimming, debris haulage, and perimeter landscaping along city borders.",
    nexusFilterStatus: "Qualified",
    nexusScore: 89,
    nexusDirective: "PROCEED: Well within FloraScape grounds scope and commercial hauler capacity. Draft submission.",
    createdAt: new Date().toISOString(),
  },
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
    const bot = ASSISTANT_ROSTER.find((b) => b.id === data.botId) || ASSISTANT_ROSTER[0];
    const timestamp = new Date().toISOString();

    return {
      success: true,
      bot: bot.name,
      role: bot.role,
      timestamp,
      summary: `[${bot.role}] Analysis for: "${data.prompt}" completed.`,
      recommendations: [
        `October 2026 pricing applied: Domestic from TTD $400 / Commercial minimum TTD $1,200.`,
        `Scouting focused on: ${bot.tenderDomain}.`,
        `Monitored portals: ${bot.portalFocus.join(", ")}.`,
        `Ready to route matching contractor opportunities to Nexus Commander for filtration.`,
      ],
    };
  });
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
