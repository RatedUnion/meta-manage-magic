import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, Cloud, CloudRain, ExternalLink, MapPin, Plus, RefreshCw, ShieldAlert, Siren, TrafficCone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useViewMode } from "@/lib/view-mode";
import { getOperationalWeather } from "@/lib/operational-situation.functions";

export const Route = createFileRoute("/_authenticated/monitoring")({
  component: MonitoringPage,
  head: () => ({ meta: [{ title: "Operations & Situation Monitor — DUAA" }, { name: "robots", content: "noindex" }] }),
});

const SITE_URL = "https://meta-manage-magic.lovable.app";
const AREAS = ["Port of Spain", "Diego Martin", "Chaguanas", "San Fernando", "Point Lisas", "Arima", "Sangre Grande", "Mayaro", "Scarborough", "Crown Point", "Roxborough"] as const;
const SEVERITIES = ["Low", "Moderate", "High", "Critical"] as const;
const SITUATION_STATES = ["Open", "Monitoring", "Resolved"] as const;
type Severity = (typeof SEVERITIES)[number];
type SituationState = (typeof SITUATION_STATES)[number];
type Situation = { id: string; title: string; area: string; severity: Severity; details: string; response: string; state: SituationState; createdAt: string };
type WeatherResult = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof getOperationalWeather>>>>;

function mapsUrl(area: string, mode: "search" | "traffic" | "directions") {
  const query = encodeURIComponent(`${area}, Trinidad and Tobago`);
  if (mode === "directions") return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const search = mode === "traffic" ? `traffic near ${area}, Trinidad and Tobago` : `${area}, Trinidad and Tobago`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(search)}${mode === "traffic" ? "&layer=t" : ""}`;
}

function weatherLabel(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog / low visibility";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow / ice";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown conditions";
}

function weatherAdvice(code: number, windKmh: number, rainMm: number) {
  if (code >= 95 || windKmh >= 50) return "High weather risk: check official alerts, avoid exposed or flooded routes, and confirm crew safety before dispatch.";
  if (rainMm >= 2 || (code >= 51 && code <= 82)) return "Wet-weather conditions: allow extra travel time and confirm access, drainage, and safe work conditions with the customer.";
  if (code >= 45 && code <= 48) return "Reduced visibility possible: confirm route and arrival details before travel.";
  return "No severe signal in this snapshot. Continue to verify local conditions and customer access.";
}

function MonitoringPage() {
  const checkSite = useServerFn(getOperationalWeather);
  const { viewOnly } = useViewMode();
  const [siteLoading, setSiteLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherArea, setWeatherArea] = useState<(typeof AREAS)[number]>(AREAS[0]);
  const [weather, setWeather] = useState<Awaited<ReturnType<typeof checkSite>> | null>(null);
  const [siteResult, setSiteResult] = useState<{ statusCode: number; responseTimeMs: number; checkedAt: string; dnsResolved: boolean; sslValid: boolean } | null>(null);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", area: AREAS[0] as string, severity: "Moderate" as Severity, details: "" });

  const situationCounts = useMemo(() => ({
    open: situations.filter((item) => item.state === "Open").length,
    monitoring: situations.filter((item) => item.state === "Monitoring").length,
    resolved: situations.filter((item) => item.state === "Resolved").length,
  }), [situations]);

  const runSiteCheck = async () => {
    if (viewOnly) return toast.info("Exit affiliate preview to run checks.");
    setSiteLoading(true);
    const start = Date.now();
    try {
      const response = await fetch(SITE_URL, { method: "HEAD", mode: "no-cors", cache: "no-store" });
      const ok = response.type === "opaque" || response.ok;
      setSiteResult({ statusCode: response.type === "opaque" ? 200 : response.status, responseTimeMs: Math.max(1, Date.now() - start), checkedAt: new Date().toISOString(), dnsResolved: true, sslValid: SITE_URL.startsWith("https://") && ok });
      toast.success("Site reachability check completed. Browser cross-origin checks cannot confirm the exact HTTP status.");
    } catch {
      setSiteResult({ statusCode: 0, responseTimeMs: Math.max(1, Date.now() - start), checkedAt: new Date().toISOString(), dnsResolved: false, sslValid: false });
      toast.error("Could not reach the site from this browser.");
    } finally { setSiteLoading(false); }
  };

  const runWeatherCheck = async () => {
    if (viewOnly) return toast.info("Exit affiliate preview to run checks.");
    setWeatherLoading(true);
    try {
      const result = await checkSite({ data: { area: weatherArea } });
      setWeather(result);
      toast.success(`Weather snapshot updated for ${weatherArea}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not get weather conditions"); }
    finally { setWeatherLoading(false); }
  };

  const createSituation = (event: React.FormEvent) => {
    event.preventDefault();
    if (viewOnly) return;
    const title = form.title.trim();
    const details = form.details.trim();
    if (!title || !details) return toast.error("Add a situation title and details first.");
    const severity = form.severity;
    const response = severity === "Critical"
      ? "Escalate to the owner immediately. Confirm staff/customer safety, pause unsafe dispatch, and verify emergency contacts."
      : severity === "High"
        ? "Call the customer and assigned crew, review weather/route conditions, and agree a safe service plan before dispatch."
        : severity === "Moderate"
          ? "Contact the customer, verify access and timing, and monitor for updates before assigning or changing a dispatch."
          : "Log the update, confirm details with the customer, and review again if conditions change.";
    setSituations((items) => [{ id: crypto.randomUUID(), title, area: form.area, severity, details, response, state: "Open", createdAt: new Date().toISOString() }, ...items]);
    setForm({ title: "", area: weatherArea, severity: "Moderate", details: "" });
    setFormOpen(false);
    toast.success("Situation added to this session's response board.");
  };

  const changeSituationState = (id: string, state: SituationState) => {
    setSituations((items) => items.map((item) => item.id === id ? { ...item, state } : item));
  };

  const weatherIcon = weather?.current.weatherCode && weather.current.weatherCode >= 51 ? CloudRain : Cloud;
  const WeatherIcon = weatherIcon;
  const nextHour = weather?.forecast[0];

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild><Link to="/bookings"><ArrowLeft className="mr-2 h-4 w-4" />Bookings</Link></Button>
            <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Activity className="h-6 w-6 text-primary" />Operations & situation monitor</h1><p className="mt-1 text-sm text-muted-foreground">Weather, maps/traffic links, site reachability, and a response board.</p></div>
          </div>
          <Button size="sm" onClick={() => setFormOpen(true)} disabled={viewOnly}><Plus className="mr-2 h-4 w-4" />Log situation</Button>
        </header>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          Weather is a third-party forecast snapshot, not an official emergency alert. Maps and traffic open Google Maps externally. The situation board is local to this browser session; it does not dispatch crews or persist incidents.
        </div>
        {viewOnly && <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">Affiliate preview is read-only. Checks and situation updates are disabled.</p>}

        <section className="grid gap-4 lg:grid-cols-2" aria-label="Weather and maps">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Cloud className="h-5 w-5 text-sky-500" />Weather conditions & changes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <select aria-label="Weather area" value={weatherArea} onChange={(event) => setWeatherArea(event.target.value as (typeof AREAS)[number])} className="h-10 min-w-48 flex-1 rounded-md border border-input bg-background px-3 text-sm">
                  {AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                <Button onClick={() => void runWeatherCheck()} disabled={weatherLoading || viewOnly}><RefreshCw className={`mr-2 h-4 w-4 ${weatherLoading ? "animate-spin" : ""}`} />{weatherLoading ? "Checking…" : "Check weather"}</Button>
              </div>
              {weather ? <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Now</p><p className="mt-1 text-xl font-semibold">{Math.round(weather.current.temperatureC)}°C</p><p className="text-xs text-muted-foreground">{weatherLabel(weather.current.weatherCode)}</p></div>
                  <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Feels like</p><p className="mt-1 text-xl font-semibold">{Math.round(weather.current.feelsLikeC)}°C</p></div>
                  <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Rain / humidity</p><p className="mt-1 text-xl font-semibold">{weather.current.precipitationMm} mm</p><p className="text-xs text-muted-foreground">{weather.current.humidityPercent}% humidity</p></div>
                  <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Wind / gusts</p><p className="mt-1 text-xl font-semibold">{Math.round(weather.current.windSpeedKmh)} km/h</p><p className="text-xs text-muted-foreground">Gusts {Math.round(weather.current.windGustKmh)} km/h</p></div>
                </div>
                <div className="rounded-md border p-3"><p className="text-sm font-medium">Operational guidance</p><p className="mt-1 text-sm text-muted-foreground">{weatherAdvice(weather.current.weatherCode, weather.current.windGustKmh, weather.current.precipitationMm)}</p></div>
                {nextHour && <div><p className="mb-2 text-sm font-medium">Next few hourly forecast points</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{weather.forecast.map((hour) => <div key={hour.time} className="rounded-md border p-2 text-xs"><p className="font-medium">{hour.time.slice(11, 16)}</p><p className="mt-1">{Math.round(hour.temperatureC)}°C · {weatherLabel(hour.weatherCode)}</p><p className="text-muted-foreground">Rain {hour.precipitationProbability}% · {hour.precipitationMm} mm</p><p className="text-muted-foreground">Wind {Math.round(hour.windSpeedKmh)} km/h</p></div>)}</div></div>}
                <p className="text-xs text-muted-foreground">Source: {weather.source} · Updated {new Date(weather.updatedAt).toLocaleString()} local time. Forecast is informational, not an official warning.</p>
              </> : <p className="text-sm text-muted-foreground">Choose an area and check for a current snapshot and near-term forecast.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrafficCone className="h-5 w-5 text-amber-500" />Maps, traffic & route planning</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-1 text-sm font-medium">Area<select value={weatherArea} onChange={(event) => setWeatherArea(event.target.value as (typeof AREAS)[number])} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{AREAS.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button variant="outline" asChild><a href={mapsUrl(weatherArea, "search")} target="_blank" rel="noreferrer"><MapPin className="mr-2 h-4 w-4" />Open area map</a></Button>
                <Button variant="outline" asChild><a href={mapsUrl(weatherArea, "traffic")} target="_blank" rel="noreferrer"><TrafficCone className="mr-2 h-4 w-4" />Traffic map</a></Button>
                <Button variant="outline" asChild><a href={mapsUrl(weatherArea, "directions")} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Plan route</a></Button>
              </div>
              <p className="text-xs text-muted-foreground">Google Maps opens in a new tab. Traffic conditions and route timing come from Google Maps and are not monitored or guaranteed by this dashboard.</p>
              <div className="rounded-md border p-3"><p className="text-sm font-medium">Before dispatch</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground"><li>Confirm the customer’s exact address and access point.</li><li>Check route conditions immediately before departure.</li><li>Allow extra time for rain, flooding, or traffic disruption.</li></ul></div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Situation counts">
          <Card><CardContent className="pt-5"><p className="text-xs uppercase text-muted-foreground">Open</p><p className="mt-1 text-2xl font-semibold">{situationCounts.open}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-xs uppercase text-muted-foreground">Monitoring</p><p className="mt-1 text-2xl font-semibold">{situationCounts.monitoring}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-xs uppercase text-muted-foreground">Resolved</p><p className="mt-1 text-2xl font-semibold">{situationCounts.resolved}</p></CardContent></Card>
        </section>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Siren className="h-5 w-5 text-destructive" />Situation control & response board</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!situations.length && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No situations logged in this session. Use “Log situation” to record a weather, route, access, safety, or service disruption.</p>}
            {situations.map((item) => <article key={item.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.title}</h3><Badge variant={item.severity === "Critical" || item.severity === "High" ? "destructive" : "secondary"}>{item.severity}</Badge><Badge variant="outline">{item.state}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.area} · Logged {new Date(item.createdAt).toLocaleString()}</p></div>{!viewOnly && <select aria-label={`Update status for ${item.title}`} value={item.state} onChange={(event) => changeSituationState(item.id, event.target.value as SituationState)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">{SITUATION_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select>}</div><p className="mt-3 whitespace-pre-wrap text-sm">{item.details}</p><div className="mt-3 rounded-md bg-muted/50 p-3"><p className="flex items-center gap-2 text-sm font-medium"><ShieldAlert className="h-4 w-4 text-primary" />Suggested response checklist</p><p className="mt-1 text-sm text-muted-foreground">{item.response}</p></div></article>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Website reachability</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">{siteResult ? `${siteResult.statusCode || "No response"} · ${siteResult.responseTimeMs} ms · checked ${new Date(siteResult.checkedAt).toLocaleString()}` : "No site check run in this session."}</p><p className="mt-1 text-xs text-muted-foreground">This is a simple reachability check; it does not verify booking, payment, AI, or social integrations.</p></div><Button variant="outline" onClick={() => void runSiteCheck()} disabled={siteLoading || viewOnly}><RefreshCw className={`mr-2 h-4 w-4 ${siteLoading ? "animate-spin" : ""}`} />{siteLoading ? "Checking…" : "Check site"}</Button></CardContent>
        </Card>

        {formOpen && !viewOnly && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="situation-dialog-title"><form onSubmit={createSituation} className="my-auto w-full max-w-lg space-y-4 rounded-xl border bg-card p-6 shadow-xl"><div className="flex items-center justify-between"><div><h2 id="situation-dialog-title" className="text-lg font-semibold">Log an operational situation</h2><p className="text-xs text-muted-foreground">Creates a temporary record in this browser session.</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setFormOpen(false)} aria-label="Close"><X className="h-4 w-4" /></Button></div>
          <label className="block space-y-1 text-sm font-medium">Situation title<Input maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Heavy rain affecting site access" required /></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1 text-sm font-medium">Area<select value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{AREAS.map((area) => <option key={area} value={area}>{area}</option>)}</select></label><label className="block space-y-1 text-sm font-medium">Severity<select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value as Severity })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}</select></label></div>
          <label className="block space-y-1 text-sm font-medium">Situation / verified information<Textarea maxLength={1000} rows={4} value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="Record what was observed, source, time, customer/crew impact, and what is not yet confirmed." required /></label>
          <p className="text-xs text-muted-foreground">Response suggestions are operational prompts, not emergency-service instructions. For immediate danger, contact local emergency services and follow official advisories.</p>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit">Add to response board</Button></div>
        </form></div>}
      </div>
    </main>
  );
}
