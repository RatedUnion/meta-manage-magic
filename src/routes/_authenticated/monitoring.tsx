import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, ArrowLeft, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { runSiteDiagnostics, type MonitorCheckResult } from "@/lib/monitoring.functions";
import { useViewMode } from "@/lib/view-mode";

export const Route = createFileRoute("/_authenticated/monitoring")({
  component: MonitoringPage,
  head: () => ({ meta: [{ title: "Service Health Monitor — DUAA" }, { name: "robots", content: "noindex" }] }),
});

const SITE_URL = "https://meta-manage-magic.lovable.app";

function MonitoringPage() {
  const checkSite = useServerFn(runSiteDiagnostics);
  const { viewOnly } = useViewMode();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MonitorCheckResult[]>([]);
  const current = history[0] ?? null;

  const triggerCheck = async () => {
    if (viewOnly) return toast.info("Exit affiliate preview to run diagnostics.");
    setLoading(true);
    try {
      const result = await checkSite({ data: { url: SITE_URL } });
      setHistory((previous) => [result, ...previous].slice(0, 20));
      if (result.statusCode >= 200 && result.statusCode < 300) toast.success(`Site responded in ${result.responseTimeMs} ms`);
      else toast.warning(result.statusCode ? `Site returned HTTP ${result.statusCode}` : "Site did not respond before timeout");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Diagnostic check failed"); }
    finally { setLoading(false); }
  };

  const statusLabel = !current ? "Not checked" : current.statusCode >= 200 && current.statusCode < 300 ? "Operational" : current.statusCode ? "Needs review" : "No response";

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Button variant="outline" size="sm" asChild><Link to="/bookings"><ArrowLeft className="mr-2 h-4 w-4" />Bookings</Link></Button><div><h1 className="text-2xl font-bold">Service health monitor</h1><p className="mt-1 text-sm text-muted-foreground">On-demand HTTPS reachability check for the DUAA site.</p></div></div><Button onClick={() => void triggerCheck()} disabled={loading || viewOnly} size="sm"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "Checking…" : "Run site check"}</Button></header>
        <p className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-sm text-muted-foreground">Checks are run only when requested. A successful response confirms the site answered at check time; it does not monitor booking, payment, Facebook, or AI services.</p>
        {viewOnly && <p className="text-sm text-muted-foreground">Affiliate preview is read-only; diagnostics are disabled.</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="flex items-center gap-4 pt-6"><Activity className="h-8 w-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Latest response</p><p className="text-xl font-bold">{statusLabel}</p>{current && <Badge className="mt-1" variant={current.statusCode >= 200 && current.statusCode < 300 ? "default" : "destructive"}>{current.statusCode || "Timeout"}</Badge>}</div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 pt-6"><Clock className="h-8 w-8 text-sky-500" /><div><p className="text-xs text-muted-foreground">Response time</p><p className="text-xl font-bold">{current ? `${current.responseTimeMs} ms` : "—"}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 pt-6"><ShieldCheck className="h-8 w-8 text-indigo-500" /><div><p className="text-xs text-muted-foreground">HTTPS / DNS check</p><p className="text-xl font-bold">{current ? `${current.sslValid ? "HTTPS" : "HTTPS issue"} · ${current.dnsResolved ? "Resolved" : "Unresolved"}` : "Not checked"}</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="text-base">Recent check history</CardTitle></CardHeader><CardContent className="divide-y divide-border">{history.length ? history.map((item, index) => <div key={`${item.checkedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-mono text-xs">{item.url}</p><p className="text-xs text-muted-foreground">{new Date(item.checkedAt).toLocaleString()} · DNS {item.dnsResolved ? "resolved" : "not resolved"} · HTTPS {item.sslValid ? "valid" : "not verified"}</p></div><div className="flex items-center gap-3"><Badge variant={item.statusCode >= 200 && item.statusCode < 300 ? "default" : "destructive"}>{item.statusCode || "Offline"}</Badge><span className="font-mono text-xs text-muted-foreground">{item.responseTimeMs} ms</span></div></div>) : <p className="py-8 text-center text-sm text-muted-foreground">No checks run in this session. Run a check to record a result.</p>}</CardContent></Card>
      </div>
    </main>
  );
}
