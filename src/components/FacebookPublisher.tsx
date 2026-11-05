import { useCallback, useEffect, useState } from "react";
import { Facebook, Link2, Send, Unplug, RefreshCw, Download, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MARKETPLACE_SCRIPTS } from "@/data/marketplace-scripts";
import { CAMPAIGN_LOCATIONS, mapUrlFor, referenceFor, renderQrFlyer, serviceUrlFor } from "@/lib/qr-flyer";

type FacebookPage = { id: string; page_id: string; page_name: string; status: string };
type QrDestination = "booking" | "maps";

async function errorText(error: unknown, fallback: string) {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

export function FacebookPublisher() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [scriptId, setScriptId] = useState("");
  const [location, setLocation] = useState<string>(CAMPAIGN_LOCATIONS.Trinidad[0]);
  const [qrDestination, setQrDestination] = useState<QrDestination>("booking");
  const [attachQr, setAttachQr] = useState(true);
  const [flyer, setFlyer] = useState<string | null>(null);
  const script = MARKETPLACE_SCRIPTS.find((s) => s.id === scriptId);
  const bookingUrl = serviceUrlFor(script?.category);
  const mapUrl = mapUrlFor(location);
  const qrUrl = qrDestination === "maps" ? mapUrl : bookingUrl;
  const qrRef = referenceFor(`${qrUrl}|${location}`);

  useEffect(() => {
    let cancelled = false;
    setFlyer(null);
    void renderQrFlyer(qrUrl, script?.title ?? "Book your appointment", qrRef, location)
      .then((dataUrl) => {
        if (!cancelled) setFlyer(dataUrl);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFlyer(null);
          toast.error(error instanceof Error ? error.message : "Could not generate the QR flyer.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [qrUrl, qrRef, script?.title, location]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-connections", { method: "GET" });
      if (error) {
        setUnavailable(await errorText(error, "Facebook connection isn't set up yet. Add your Meta app details to switch it on."));
        setPages([]);
        return;
      }
      setUnavailable(null);
      const list: FacebookPage[] = data?.facebookPages ?? [];
      setPages(list);
      setSelected((current) => list.some((page) => page.id === current && page.status === "active")
        ? current
        : list.find((page) => page.status === "active")?.id ?? "");
    } catch {
      setUnavailable("Could not reach Facebook right now. Refresh and try again.");
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("meta");
    if (result === "connected") toast.success("Facebook Page connected.");
    if (result === "error") {
      const reason = params.get("reason") ?? "";
      const reasons: Record<string, string> = {
        no_pages_available: "Facebook didn't share any Pages. Reconnect and tick your DUAA Page.",
        token_exchange_failed: "Facebook rejected the sign-in code. The app secret or callback address may not match.",
        page_access_unavailable: "Facebook didn't grant Page access. Approve the Page permissions.",
        state_expired: "The sign-in took too long. Please try again.",
        authorization_denied: "Facebook access was cancelled.",
        connection_save_failed: "Facebook connected, but saving the Page failed.",
      };
      toast.error(reasons[reason] ?? `Facebook connection didn't finish (${reason || "unknown"}).`, { duration: 15000 });
    }
    void load();
  }, [load]);

  const connect = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-oauth-start", { method: "POST", body: {} });
      if (error || !data?.authorizationUrl) {
        toast.error(await errorText(error, "Couldn't open Facebook sign-in."));
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Couldn't reach Facebook sign-in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async (id: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("meta-disconnect", { method: "POST", body: { connectionId: id } });
      if (error) {
        toast.error(await errorText(error, "Couldn't disconnect this Page."));
        return;
      }
      toast.success("Facebook Page disconnected.");
      setSelected("");
      await load();
    } catch {
      toast.error("Could not reach Facebook. The connection was not changed.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!selected || !message.trim()) return toast.error("Pick a Page and write a message first.");
    setBusy(true);
    try {
      const postMessage = `${message.trim()}\n\nServing: ${location}\nBook: ${bookingUrl}\nMap: ${mapUrl}\nRef: ${qrRef}`;
      const { data, error } = await supabase.functions.invoke("meta-publish", {
        method: "POST",
        body: {
          connectionId: selected,
          message: postMessage,
          imageBase64: attachQr && flyer ? flyer : undefined,
        },
      });
      if (error) {
        toast.error(await errorText(error, "Facebook couldn't publish this post."));
        return;
      }
      toast.success("Posted to Facebook.", {
        action: data?.postId
          ? { label: "View", onClick: () => window.open(`https://facebook.com/${data.postId}`, "_blank", "noopener,noreferrer") }
          : undefined,
      });
      setMessage("");
    } catch {
      toast.error("Could not reach Facebook. Verify the post before trying again.");
    } finally {
      setBusy(false);
    }
  };

  const active = pages.filter((page) => page.status === "active");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Facebook className="h-5 w-5 text-primary" /> Facebook publishing
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => void load()} disabled={loading} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {unavailable && <p role="status" className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">{unavailable}</p>}

        <div className="space-y-2">
          {pages.length === 0 && !loading && <p className="text-sm text-muted-foreground">No Facebook Page connected.</p>}
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-sm font-medium">{page.page_name}</span>
                <Badge variant={page.status === "active" ? "default" : "secondary"}>
                  {page.status === "active" ? "Connected" : "Reconnect needed"}
                </Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => void disconnect(page.id)} disabled={busy} aria-label={`Disconnect ${page.page_name}`}>
                <Unplug className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button onClick={() => void connect()} disabled={busy} variant="outline" className="w-full">
            <Link2 className="mr-2 h-4 w-4" />{pages.length ? "Connect another Page" : "Connect Facebook Page"}
          </Button>
        </div>

        {active.length > 0 && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                Facebook Page
                <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground" value={selected} onChange={(event) => setSelected(event.target.value)}>
                  {active.map((page) => <option key={page.id} value={page.id}>{page.page_name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                Promo script
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  value={scriptId}
                  onChange={(event) => {
                    setScriptId(event.target.value);
                    const selectedScript = MARKETPLACE_SCRIPTS.find((item) => item.id === event.target.value);
                    if (selectedScript) setMessage(selectedScript.fullScript);
                  }}
                >
                  <option value="">Use a promo script…</option>
                  {MARKETPLACE_SCRIPTS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Campaign service area</span>
                <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground" value={location} onChange={(event) => setLocation(event.target.value)}>
                  <optgroup label="Trinidad">
                    {CAMPAIGN_LOCATIONS.Trinidad.map((area) => <option key={area} value={area}>{area}</option>)}
                  </optgroup>
                  <optgroup label="Tobago">
                    {CAMPAIGN_LOCATIONS.Tobago.map((area) => <option key={area} value={area}>{area}</option>)}
                  </optgroup>
                </select>
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                QR code opens
                <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground" value={qrDestination} onChange={(event) => setQrDestination(event.target.value as QrDestination)}>
                  <option value="booking">Service booking page</option>
                  <option value="maps">Google Maps service area</option>
                </select>
              </label>
            </div>

            <Textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your Facebook post…" />
            <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center">
              {flyer ? <img src={flyer} alt={`QR flyer for ${location}, linking to ${qrUrl}`} className="h-32 w-32 shrink-0 rounded-md" /> : <div className="h-32 w-32 shrink-0 animate-pulse rounded-md bg-muted" aria-label="Generating QR flyer" />}
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <p className="font-mono font-semibold">{qrRef}</p>
                <p className="text-muted-foreground">Serving: {location}</p>
                <p className="truncate text-muted-foreground">QR destination: {qrUrl}</p>
                <a href={mapUrl} target="_blank" rel="noreferrer" className="text-primary underline">Preview Google Maps area</a>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={attachQr} onChange={(event) => setAttachQr(event.target.checked)} />
                  Attach QR flyer image to the post
                </label>
                {flyer && <a href={flyer} download={`${qrRef}.png`} className="inline-flex items-center gap-1 text-primary underline"><Download className="h-4 w-4" />Download QR flyer</a>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Facebook post will include booking and Google Maps links for the selected area.</p>
            <Button onClick={() => void publish()} disabled={busy || !message.trim() || !flyer} className="w-full">
              <Send className="mr-2 h-4 w-4" />Publish to Facebook now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
