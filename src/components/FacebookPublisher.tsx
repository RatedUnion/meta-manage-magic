import { useCallback, useEffect, useState } from "react";
import { Facebook, Link2, Send, Unplug, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MARKETPLACE_SCRIPTS } from "@/data/marketplace-scripts";

type FacebookPage = { id: string; page_id: string; page_name: string; status: string };
type Props = { draftMessage?: string };

async function errorText(error: unknown, fallback: string) {
  const ctx = (error as { context?: Response } | null)?.context;
  if (ctx && typeof ctx.json === "function") {
    try { const body = await ctx.json(); if (body?.error) return String(body.error); } catch { /* ignore */ }
  }
  return fallback;
}

export function FacebookPublisher({ draftMessage }: Props) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  useEffect(() => { if (draftMessage !== undefined) setMessage(draftMessage); }, [draftMessage]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-connections", { method: "GET" });
      if (error) {
        setUnavailable(await errorText(error, "Facebook is temporarily unavailable. Your saved connection and draft are retained; retry shortly."));
        return;
      }
      setUnavailable(null);
      const list: FacebookPage[] = data?.facebookPages ?? [];
      setPages(list);
      setSelected((current) => list.some((page) => page.id === current && page.status === "active")
        ? current
        : list.find((page) => page.status === "active")?.id ?? "");
    } catch {
      setUnavailable("Could not reach Facebook right now. Your saved connection and draft are retained; retry shortly.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("meta");
    if (result === "connected") toast.success("Facebook Page connected.");
    if (result === "error") {
      const reason = params.get("reason") ?? "";
      const reasons: Record<string, string> = {
        no_pages_available: "Facebook didn't share any Pages. Reconnect and select your Page.",
        token_exchange_failed: "Facebook rejected sign-in. Check the Meta app secret and callback configuration; your existing Page connections are not removed.",
        page_access_unavailable: "Facebook didn't grant Page access. Check Page permissions; existing connections are retained.",
        state_expired: "Sign-in expired. Please try again.",
        authorization_denied: "Facebook access was cancelled. Existing connections are unchanged.",
        connection_save_failed: "Facebook could not save the new Page. Existing connections are unchanged.",
      };
      toast.error(reasons[reason] ?? `Facebook connection didn't finish (${reason || "unknown"}).`, { duration: 15000 });
    }
    void load();
  }, [load]);

  const connect = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-oauth-start", { method: "POST", body: {} });
      if (error || !data?.authorizationUrl) { toast.error(await errorText(error, "Couldn't open Facebook sign-in. Check configuration; current connections are retained.")); return; }
      window.location.href = data.authorizationUrl;
    } catch { toast.error("Facebook sign-in could not be reached. Existing connections remain unchanged."); }
    finally { setBusy(false); }
  };

  const disconnect = async (id: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("meta-disconnect", { method: "POST", body: { connectionId: id } });
      if (error) { toast.error(await errorText(error, "Couldn't disconnect this Page.")); return; }
      toast.success("Facebook Page disconnected.");
      setSelected("");
      await load();
    } catch { toast.error("Could not reach Facebook. The connection was not changed."); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    if (!selected || !message.trim()) { toast.error("Pick a Page and review a message first."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-publish", { method: "POST", body: { connectionId: selected, message } });
      if (error) { toast.error(await errorText(error, "Facebook couldn't publish this post. Your Page connection was not deleted; check the key/permissions or reconnect if requested.")); return; }
      toast.success("Posted to Facebook.", { action: data?.postId ? { label: "View", onClick: () => window.open(`https://facebook.com/${data.postId}`, "_blank", "noopener,noreferrer") } : undefined });
      setMessage("");
    } catch { toast.error("Could not reach Facebook. The post may not have been published; verify before retrying. Your connection and draft are retained."); }
    finally { setBusy(false); }
  };

  const active = pages.filter((page) => page.status === "active");
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg"><Facebook className="h-5 w-5 text-primary" />Facebook publishing</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => void load()} disabled={loading} aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {unavailable && <p role="status" className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">{unavailable}</p>}
        <div className="space-y-2">
          {pages.length === 0 && !loading && <p className="text-sm text-muted-foreground">No Facebook Page connection is currently available.</p>}
          {pages.map((page) => <div key={page.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2"><div className="flex items-center gap-2 min-w-0"><span className="truncate text-sm font-medium">{page.page_name}</span><Badge variant={page.status === "active" ? "default" : "secondary"}>{page.status === "active" ? "Connected" : "Reconnect needed"}</Badge></div><Button size="sm" variant="outline" onClick={() => void disconnect(page.id)} disabled={busy} aria-label={`Disconnect ${page.page_name}`}><Unplug className="h-4 w-4" /></Button></div>)}
          <Button onClick={() => void connect()} disabled={busy} variant="outline" className="w-full"><Link2 className="mr-2 h-4 w-4" />{pages.length ? "Connect another Page" : "Connect Facebook Page"}</Button>
        </div>
        {active.length > 0 && <div className="space-y-2 border-t border-border pt-4"><div className="flex flex-col gap-2 sm:flex-row"><select className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm" value={selected} onChange={(event) => setSelected(event.target.value)}>{active.map((page) => <option key={page.id} value={page.id}>{page.page_name}</option>)}</select><select className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm" value="" onChange={(event) => { const script = MARKETPLACE_SCRIPTS.find((item) => item.id === event.target.value); if (script) setMessage(script.fullScript); }}><option value="">Use a promo script…</option>{MARKETPLACE_SCRIPTS.map((script) => <option key={script.id} value={script.id}>{script.title}</option>)}</select></div><Textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write or review your Facebook post…"/><p className="text-xs text-muted-foreground">Publishing requires your explicit click. Review the text and all claims before posting.</p><Button onClick={() => void publish()} disabled={busy || !message.trim()} className="w-full"><Send className="mr-2 h-4 w-4" />Publish reviewed post</Button></div>}
      </CardContent>
    </Card>
  );
}
