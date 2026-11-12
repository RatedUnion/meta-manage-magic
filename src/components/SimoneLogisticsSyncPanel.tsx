import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { syncSimoneWithLogisticsDispatcher, type SimoneLogisticsSyncReport } from "@/lib/simone-logistics.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, PhoneCall, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function SimoneLogisticsSyncPanel() {
  const sync = useServerFn(syncSimoneWithLogisticsDispatcher);
  const [report, setReport] = useState<SimoneLogisticsSyncReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    try {
      setReport(await sync({ data: { filterUrgentOnly: false } }));
      toast.success("Synced Simone callbacks with Logistics Dispatcher");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Message copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Simone × Logistics Dispatcher</CardTitle>
              <CardDescription className="text-xs">Turns missed calls into dispatch routes and draft client messages</CardDescription>
            </div>
          </div>
          <Button onClick={() => void handleSync()} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Syncing…" : "Sync dispatch"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!report ? (
          <p className="text-xs text-muted-foreground">Click "Sync dispatch" to review pending Simone callbacks.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">Pending: {report.totalPendingCallbacks}</Badge>
              <Badge variant={report.urgentDispatches > 0 ? "destructive" : "secondary"}>Urgent: {report.urgentDispatches}</Badge>
            </div>
            <p className="text-xs font-medium">{report.operationalSummary}</p>
            {report.directives.map((item) => (
              <div key={item.reminderId} className="space-y-2 rounded-lg border p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold"><PhoneCall className="h-3.5 w-3.5 text-primary" />{item.contactName} <span className="font-normal text-muted-foreground">({item.phoneNumber})</span></span>
                  <span className="flex gap-1.5">
                    <Badge variant={item.priority === "urgent" ? "destructive" : "outline"}>{item.priority.toUpperCase()}</Badge>
                    <Badge variant="secondary">{item.corridor}</Badge>
                  </span>
                </div>
                <p className="text-muted-foreground">{item.detectedService} · {item.crewRequirements} · ~{item.estimatedTransitMinutes} min</p>
                <div className="space-y-1 rounded bg-muted/50 p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Client message</span>
                    <button type="button" onClick={() => copy(item.reminderId, item.suggestedClientNotification)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {copiedId === item.reminderId ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}Copy
                    </button>
                  </div>
                  <p className="italic">{item.suggestedClientNotification}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
