import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface LogisticsSyncDirective {
  reminderId: string;
  contactName: string;
  phoneNumber: string;
  detectedService: "mechanic" | "electrician" | "towing_transport" | "landscaping" | "general";
  priority: "urgent" | "high" | "standard";
  corridor: "East-West (CRH)" | "Central (UBH)" | "South (SHH)" | "General T&T";
  estimatedTransitMinutes: number;
  crewRequirements: string;
  suggestedClientNotification: string;
  suggestedCrewNotification: string;
}

export interface SimoneLogisticsSyncReport {
  timestamp: string;
  totalPendingCallbacks: number;
  urgentDispatches: number;
  directives: LogisticsSyncDirective[];
  operationalSummary: string;
}

export const syncSimoneWithLogisticsDispatcher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ filterUrgentOnly: z.boolean().default(false) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    // 1. Fetch unhandled callback reminders logged by Simone
    const { data: reminders, error: reminderError } = await supabase
      .from("callback_reminders")
      .select("id, contact_name, phone_number, reason, message, created_at, reminder_at")
      .eq("status", "pending")
      .order("reminder_at", { ascending: true })
      .limit(30);

    if (reminderError) {
      throw new Error(`Failed to load Simone callbacks: ${reminderError.message}`);
    }

    const directives: LogisticsSyncDirective[] = (reminders || []).map((item) => {
      const text = `${item.reason || ""} ${item.message || ""}`.toLowerCase();
      
      let detectedService: LogisticsSyncDirective["detectedService"] = "general";
      let priority: LogisticsSyncDirective["priority"] = "standard";
      let corridor: LogisticsSyncDirective["corridor"] = "Central (UBH)";
      let estimatedTransitMinutes = 60;
      let crewRequirements = "1 Technician";

      // Service detection & corridor evaluation
      if (text.includes("towing") || text.includes("tow") || text.includes("stuck") || text.includes("flatbed")) {
        detectedService = "towing_transport";
        priority = "urgent";
        estimatedTransitMinutes = 40;
        crewRequirements = "1 Driver + Heavy Flatbed / Wrecker";
      } else if (text.includes("mechanic") || text.includes("engine") || text.includes("breakdown") || text.includes("car")) {
        detectedService = "mechanic";
        priority = text.includes("highway") || text.includes("stuck") ? "urgent" : "high";
        estimatedTransitMinutes = 45;
        crewRequirements = "1 Mobile Mechanic (OBD Diagnostic Kit)";
      } else if (text.includes("electric") || text.includes("breaker") || text.includes("spark") || text.includes("generator")) {
        detectedService = "electrician";
        priority = "high";
        estimatedTransitMinutes = 50;
        crewRequirements = "1 Certified Electrician (T&TEC Safety Rig)";
      } else if (text.includes("landscape") || text.includes("grass") || text.includes("garden") || text.includes("tree")) {
        detectedService = "landscaping";
        priority = "standard";
        estimatedTransitMinutes = 75;
        crewRequirements = "1–2 Crew Members (Commercial/Domestic Rig)";
      }

      // Corridor detection from message content
      if (text.includes("pos") || text.includes("port of spain") || text.includes("ar 一ima") || text.includes("arima") || text.includes("crh")) {
        corridor = "East-West (CRH)";
      } else if (text.includes("san fernando") || text.includes("couva") || text.includes("debe")) {
        corridor = "South (SHH)";
      }

      // Draft tailored notifications
      const suggestedClientNotification = `Hi ${item.contact_name}, DUAA Logistics Dispatcher received your inquiry via Simone (+1 868-763-1106). A technician is scheduled for the ${corridor} transit route (ETA ~${estimatedTransitMinutes} mins). Standard appointment fee: TTD $110. Please reply to confirm your location.`;

      const suggestedCrewNotification = `[DISPATCH ALERT] ${priority.toUpperCase()}: ${detectedService.toUpperCase()} requested by ${item.contact_name} (${item.phone_number}). Route: ${corridor}. Crew spec: ${crewRequirements}.`;

      return {
        reminderId: item.id,
        contactName: item.contact_name,
        phoneNumber: item.phone_number,
        detectedService,
        priority,
        corridor,
        estimatedTransitMinutes,
        crewRequirements,
        suggestedClientNotification,
        suggestedCrewNotification,
      };
    });

    const urgentCount = directives.filter((d) => d.priority === "urgent").length;

    return {
      timestamp: new Date().toISOString(),
      totalPendingCallbacks: directives.length,
      urgentDispatches: urgentCount,
      directives: data.filterUrgentOnly ? directives.filter((d) => d.priority === "urgent") : directives,
      operationalSummary:
        directives.length === 0
          ? "Simone has no unhandled callbacks. Logistics dispatch routes are clear."
          : `Logistics Dispatcher synchronized ${directives.length} callbacks (${urgentCount} urgent) across Trinidad transit corridors.`,
    } satisfies SimoneLogisticsSyncReport;
  });
