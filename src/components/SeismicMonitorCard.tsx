import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { getCaribbeanSeismicFeed, type SeismicEvent } from "@/lib/seismic.functions";
import { toast } from "sonner";

export function SeismicMonitorCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ updatedAt: string; events: SeismicEvent[] } | null>(null);

  async function loadFeed() {
    setLoading(true);
    try {
      const res = await getCaribbeanSeismicFeed({ data: { minMagnitude: 2.5, limit: 6 } });
      setData(res);
      toast.success("Seismic telemetry updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load seismic feed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFeed();
  }, []);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500 animate-pulse" />
            T&T & Caribbean Seismic Radar
          </CardTitle>
          <CardDescription>
            Live USGS earthquake telemetry across Trinidad, Tobago & Paria fault lines (M ≥ 2.5)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadFeed} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Scanning…" : "Scan Seismic"}
        </Button>
      </CardHeader>
      <CardContent>
        {!data || data.events.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {loading ? "Querying regional seismic arrays…" : "No seismic events (M ≥ 2.5) recorded in regional radius in last 30 days."}
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.events.map((evt) => (
              <div key={evt.id} className="rounded-lg border bg-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={evt.alertLevel === "RED" ? "destructive" : evt.alertLevel === "AMBER" ? "outline" : "secondary"}
                      className="font-bold text-xs"
                    >
                      M {evt.magnitude}
                    </Badge>
                    <span className="font-semibold text-sm">{evt.place}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Depth: {evt.depthKm} km · {evt.distanceFromPosKm} km from Port of Spain · {new Date(evt.time).toLocaleString("en-TT")} AST
                  </p>
                  <p className="text-xs text-foreground/90 font-medium">
                    {evt.dispatchDirective}
                  </p>
                </div>
                <div>
                  {evt.alertLevel === "GREEN" ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-[11px] gap-1">
                      <ShieldCheck className="h-3 w-3" /> Safe Clearance
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[11px] gap-1">
                      <AlertTriangle className="h-3 w-3" /> Hazard Hold
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground pt-1">
              Source: USGS Regional Seismic Network · Updated {new Date(data.updatedAt).toLocaleTimeString()} AST
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
