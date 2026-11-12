import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ProjectOversightReport {
  timestamp: string;
  commander: "Nexus Commander";
  status: "nominal" | "caution" | "action_required";
  activeProjectsCount: number;
  pendingPaymentApprovals: number;
  openCallbackAlerts: number;
  projectDirectives: Array<{
    projectId: string;
    customer: string;
    service: string;
    stage: "intake" | "scheduled" | "in_progress" | "review";
    health: "on_track" | "warning" | "critical";
    delegatedTo: string;
    recommendedAction: string;
  }>;
  operationalSummary: string;
}

const oversightInputSchema = z.object({
  projectId: z.string().optional(),
  includeEnvironmentalAudit: z.boolean().default(true),
});

export const runNexusProjectOversight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => oversightInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    // 1. Fetch active bookings (projects)
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, full_name, service_name, status, payment_status, total_cost, created_at, scheduled_date")
      .order("created_at", { ascending: false })
      .limit(20);

    if (bookingsError) {
      throw new Error(`Failed to load project records: ${bookingsError.message}`);
    }

    // 2. Fetch unhandled callback reminders logged by Simone
    const { data: reminders } = await supabase
      .from("callback_reminders")
      .select("id, status")
      .eq("status", "pending");

    const pendingCallbacks = reminders?.length ?? 0;

    // 3. Evaluate each project and assign specialist delegates
    const projectDirectives = (bookings || []).map((booking) => {
      let delegatedTo = "Logistics Dispatcher";
      let recommendedAction = "Review routing and field associate schedule.";
      let health: "on_track" | "warning" | "critical" = "on_track";

      const serviceLower = (booking.service_name || "").toLowerCase();

      // Delegation matrix
      if (serviceLower.includes("mechanic") || serviceLower.includes("repair") || serviceLower.includes("parts")) {
        delegatedTo = "GearMaster Dee";
        recommendedAction = "Verify OBD diagnostic logs and OEM part availability prior to dispatch.";
      } else if (serviceLower.includes("electric") || serviceLower.includes("generator") || serviceLower.includes("wiring")) {
        delegatedTo = "VoltSage";
        recommendedAction = "Cross-check 110V/220V load requirements and ensure T&TEC safety code compliance.";
      } else if (serviceLower.includes("landscape") || serviceLower.includes("floral") || serviceLower.includes("garden")) {
        delegatedTo = "FloraScape";
        recommendedAction = "Check regional weather alerts; confirm site equipment and weather-window clearance.";
      }

      // Financial verification audit
      if (booking.payment_status === "pending_review" || booking.payment_status === "unpaid") {
        health = "warning";
        delegatedTo = "TTD CashFlow Auditor";
        recommendedAction = "Confirm First Citizens Bank wire transfer reference before authorizing mobilization.";
      }

      // Minimum pricing rule checks (Domestic $250, Commercial $1,200)
      if (booking.total_cost && booking.total_cost < 110) {
        health = "critical";
        recommendedAction = "Flagged: Cost is below non-negotiable TTD $110 appointment floor.";
      }

      return {
        projectId: booking.id,
        customer: booking.full_name || "Valued Client",
        service: booking.service_name || "General Service",
        stage: booking.status === "completed" ? "review" : "in_progress",
        health,
        delegatedTo,
        recommendedAction,
      };
    });

    const pendingPayments = (bookings || []).filter(
      (b) => b.payment_status === "pending_review" || b.payment_status === "unpaid"
    ).length;

    const criticalIssues = projectDirectives.filter((p) => p.health === "critical").length;
    const warningIssues = projectDirectives.filter((p) => p.health === "warning").length;

    const status: ProjectOversightReport["status"] =
      criticalIssues > 0 ? "action_required" : warningIssues > 0 ? "caution" : "nominal";

    return {
      timestamp: new Date().toISOString(),
      commander: "Nexus Commander",
      status,
      activeProjectsCount: bookings?.length ?? 0,
      pendingPaymentApprovals: pendingPayments,
      openCallbackAlerts: pendingCallbacks,
      projectDirectives,
      operationalSummary:
        status === "nominal"
          ? "All operational pipelines are within DUAA governance tolerances. Projects dispatched to specialists."
          : `Project oversight identified ${criticalIssues} critical items and ${warningIssues} payment/routing holds requiring staff review.`,
    } satisfies ProjectOversightReport;
  });
