import { useCallback, useEffect, useState } from "react";
import { Facebook, Link2, Send, Unplug, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MARKETPLACE_SCRIPTS } from "@/data/marketplace-scripts";
import { referenceFor, renderQrFlyer, serviceUrlFor } from "@/lib/qr-flyer";

type FacebookPage = { id: string; page_id: string; page_name: string; status: string };

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
  const [attachQr, setAttachQr] = useState(true);
  const [flyer, setFlyer] = useState<string | null>(null);
  const script = MARKETPLACE_SCRIPTS.find((s) => s.id === scriptId);
  const qrUrl = serviceUrlFor(script?.category);
  const qrRef = referenceFor(qrUrl);

  useEffect(() => {
    let cancelled = false;
    void renderQrFlyer(qrUrl, script?.title ?? "Book your appointment", qrRef).then((d) => {
      if (!cancelled) setFlyer(d);
    });
    return () => {
      cancelled = true;
    };
  }, [qrUrl, qrRef, script?.title]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("meta-connections", { method: "GET" });
    if (error) {
      setUnavailable(await errorText(error, "Facebook connection isn't set up yet. Add your Meta app details to switch it on."));
      setPages([]);
    } else {
      setUnavailable(null);
      const list: FacebookPage[] = data?.facebookPages ?? [];
      setPages(list);
      setSelected((cur) => cur || list.find((p) => p.status === "active")?.id || "");
    }
    setLoading(false);
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
    const { data, error } = await supabase.functions.invoke("meta-oauth-start", { method: "POST", body: {} });
    setBusy(false);
    if (error || !data?.authorizationUrl) {
      toast.error(await errorText(error, "Couldn't open Facebook sign-in."));
      return;
    }
    window.location.href = data.authorizationUrl;
  };

  const disconnect = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("meta-disconnect", { method: "POST", body: { connectionId: id } });
    setBusy(false);
    if (error) return toast.error(await errorText(error, "Couldn't disconnect this Page."));
    toast.success("Facebook Page disconnected.");
    setSelected("");
    void load();
  };

  const publish = async () => {
    if (!selected || !message.trim()) return toast.error("Pick a Page and write a message first.");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("meta-publish", {
      method: "POST",
      body: {
        connectionId: selected,
        message: `${message.trim()}\n\nBook: ${qrUrl}\nRef: ${qrRef}`,
        imageBase64: attachQr && flyer ? flyer : undefined,
      },
    });
    setBusy(false);
    if (error) return toast.error(await errorText(error, "Facebook couldn't publish this post."));
    toast.success("Posted to Facebook.", {
      action: data?.postId
        ? { label: "View", onClick: () => window.open(`https://facebook.com/${data.postId}`, "_blank") }
        : undefined,
    });
    setMessage("");
  };

  const active = pages.filter((p) => p.status === "active");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Facebook className="h-5 w-5 text-primary" /> Facebook publishing
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {unavailable && (
          <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">{unavailable}</p>
        )}

        <div className="space-y-2">
          {pages.length === 0 && !loading && <p className="text-sm text-muted-foreground">No Facebook Page connected.</p>}
          {pages.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-sm font-medium">{p.page_name}</span>
                <Badge variant={p.status === "active" ? "default" : "secondary"}>
                  {p.status === "active" ? "Connected" : "Reconnect needed"}
                </Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => disconnect(p.id)} disabled={busy}>
                <Unplug className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button onClick={connect} disabled={busy} variant="outline" className="w-full">
            <Link2 className="mr-2 h-4 w-4" /> {pages.length ? "Connect another Page" : "Connect Facebook Page"}
          </Button>
        </div>

        {active.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {active.map((p) => (
                  <option key={p.id} value={p.id}>{p.page_name}</option>
                ))}
              </select>
              <select
                className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                value={scriptId}
                onChange={(e) => {
                  setScriptId(e.target.value);
                  const s = MARKETPLACE_SCRIPTS.find((x) => x.id === e.target.value);
                  if (s) setMessage(s.fullScript);
                }}
              >
                <option value="">Use a promo script…</option>
                {MARKETPLACE_SCRIPTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your Facebook post…" />
            <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center">
              {flyer ? (
                <img src={flyer} alt={`QR flyer linking to ${qrUrl}`} className="h-32 w-32 shrink-0 rounded-md" />
              ) : (
                <div className="h-32 w-32 shrink-0 animate-pulse rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <p className="font-mono font-semibold">{qrRef}</p>
                <p className="truncate text-muted-foreground">{qrUrl}</p>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={attachQr} onChange={(e) => setAttachQr(e.target.checked)} />
                  Attach QR flyer image to the post
                </label>
                {flyer && (
                  <a href={flyer} download={`${qrRef}.png`} className="inline-flex items-center gap-1 text-primary underline">
                    <Download className="h-4 w-4" /> Download QR flyer
                  </a>
                )}
              </div>
            </div>
            <Button onClick={publish} disabled={busy || !message.trim()} className="w-full">
              <Send className="mr-2 h-4 w-4" /> Publish to Facebook now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
