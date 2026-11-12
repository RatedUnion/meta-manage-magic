import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { runNexusProjectOversight, type ProjectOversightReport } from "@/lib/nexus-commander.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Bot, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function NexusCommanderPanel() {
  const runOversight = useServerFn(runNexusProjectOversight);
  const [report, setReport] = useState<ProjectOversightReport | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAudit = async () => {
    setLoading(true);
    try {
      const data = await runOversight({ data: { includeEnvironmentalAudit: true } });
      setReport(data);
      toast.success("Nexus Commander completed project oversight assessment");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run Nexus Commander audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/40 bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-lg">Nexus Commander · Project Overseer</CardTitle>
              <CardDescription>Primary orchestration, cross-agent delegation & risk monitoring</CardDescription>
            </div>
          </div>
          <Button onClick={handleAudit} disabled={loading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Scanning Projects…" : "Run Project Audit"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant={report.status === "nominal" ? "default" : "destructive"}>
                Status: {report.status.toUpperCase()}
              </Badge>
              <Badge variant="outline">Active Projects: {report.activeProjectsCount}</Badge>
              <Badge variant="outline">Pending Payments: {report.pendingPaymentApprovals}</Badge>
              <Badge variant="outline">Open Callbacks: {report.openCallbackAlerts}</Badge>
            </div>

            <p className="text-sm font-medium text-foreground">{report.operationalSummary}</p>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Project Directives & Delegations
              </h4>
              {report.projectDirectives.map((directive) => (
                <div
                  key={directive.projectId}
                  className="flex flex-col justify-between gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      {directive.health === "critical" ? (
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                      ) : directive.health === "warning" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      <span>{directive.customer}</span>
                      <span className="text-xs text-muted-foreground">({directive.service})</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{directive.recommendedAction}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="secondary">{directive.delegatedTo}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nexus Commander is ready on standby. Click "Run Project Audit" to evaluate all active bookings, FCB payment clearances, and agent dispatches.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
