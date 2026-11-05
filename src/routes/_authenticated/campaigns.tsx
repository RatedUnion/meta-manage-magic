import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Megaphone, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FacebookPublisher } from "@/components/FacebookPublisher";
import { useViewMode } from "@/lib/view-mode";
import { createCampaign, listCampaigns, toggleCampaignStatus, type CampaignItem } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
  head: () => ({ meta: [{ title: "Campaign Planner — DUAA" }, { name: "robots", content: "noindex" }] }),
});

const EMPTY_FORM = () => ({ title: "", targetAudience: "", channel: "WhatsApp & Social", budgetTTD: 1200, startDate: new Date().toISOString().slice(0, 10) });

function CampaignsPage() {
  const addCampaignFn = useServerFn(createCampaign);
  const toggleStatusFn = useServerFn(toggleCampaignStatus);
  const listFn = useServerFn(listCampaigns);
  const { viewOnly } = useViewMode();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    let active = true;
    listFn().then((items) => { if (active) setCampaigns(items); })
      .catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load campaigns"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [listFn]);

  const filteredCampaigns = useMemo(() => {
    const term = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesText = !term || `${campaign.title} ${campaign.targetAudience} ${campaign.channel}`.toLowerCase().includes(term);
      return matchesText && (statusFilter === "all" || campaign.status.toLowerCase() === statusFilter);
    });
  }, [campaigns, query, statusFilter]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (viewOnly) return;
    if (!form.title.trim()) return toast.error("Please enter a campaign title");
    if (!form.targetAudience.trim()) return toast.error("Add a target audience or service area");
    setSubmitting(true);
    try {
      const created = await addCampaignFn({ data: { title: form.title.trim(), targetAudience: form.targetAudience.trim(), channel: form.channel.trim(), budgetTTD: Number(form.budgetTTD) || 0, startDate: form.startDate } });
      setCampaigns((previous) => [created, ...previous]);
      setIsDialogOpen(false);
      setForm(EMPTY_FORM());
      toast.success("Campaign saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save campaign"); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (campaign: CampaignItem) => {
    if (viewOnly) return;
    const nextStatus = campaign.status === "Active" ? "Completed" : "Active";
    try {
      await toggleStatusFn({ data: { id: campaign.id, status: nextStatus } });
      setCampaigns((previous) => previous.map((item) => item.id === campaign.id ? { ...item, status: nextStatus } : item));
      toast.success(`Campaign marked ${nextStatus.toLowerCase()}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update campaign status"); }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild><Link to="/bookings"><ArrowLeft className="mr-2 h-4 w-4" />Bookings</Link></Button>
            <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Megaphone className="h-6 w-6 text-primary" />Campaign planner</h1><p className="mt-1 text-sm text-muted-foreground">Plan seasonal, service-area, and Facebook publishing activity.</p></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/publish">Open publisher</Link></Button>
            {!viewOnly && <Button size="sm" onClick={() => setIsDialogOpen(true)}><Plus className="mr-1 h-4 w-4" />New campaign</Button>}
          </div>
        </header>

        {!viewOnly && <FacebookPublisher />}
        {viewOnly && <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">Affiliate preview is read-only. Campaign creation, publishing, and status changes are disabled.</p>}

        <section className="space-y-3" aria-label="Campaign filters">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campaign, audience, or channel" className="pl-9" /></div>
          <div className="flex flex-wrap gap-2">
            {["all", "active", "draft", "completed"].map((status) => <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} className={`rounded-full border px-3 py-1.5 text-sm capitalize ${statusFilter === status ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{status}</button>)}
          </div>
        </section>

        {isDialogOpen && !viewOnly && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="campaign-dialog-title"><div className="my-auto w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-xl"><div className="flex items-center justify-between"><h2 id="campaign-dialog-title" className="text-lg font-semibold">Create campaign</h2><Button type="button" variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} aria-label="Close"><X className="h-4 w-4" /></Button></div>
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="block space-y-1 text-sm">Campaign title<Input required minLength={3} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Rainy season fleet checks" /></label>
            <label className="block space-y-1 text-sm">Audience / service area<Input required minLength={3} maxLength={200} value={form.targetAudience} onChange={(event) => setForm({ ...form, targetAudience: event.target.value })} placeholder="e.g. Point Lisas & Port of Spain" /></label>
            <label className="block space-y-1 text-sm">Channel<Input required minLength={2} maxLength={100} value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3"><label className="block space-y-1 text-sm">Budget (TTD)<Input type="number" min="0" max="100000" value={form.budgetTTD} onChange={(event) => setForm({ ...form, budgetTTD: Number(event.target.value) })} /></label><label className="block space-y-1 text-sm">Start date<Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /></label></div>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save campaign"}</Button></div>
          </form>
        </div></div>}

        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading campaigns…</p> : filteredCampaigns.length ? <div className="grid gap-4 md:grid-cols-2">{filteredCampaigns.map((campaign) => <Card key={campaign.id}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">{campaign.title}</CardTitle><p className="mt-2 text-sm text-muted-foreground">{campaign.targetAudience}</p></div><Badge variant={campaign.status === "Active" ? "default" : "secondary"}>{campaign.status}</Badge></div></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>{campaign.channel}</span><span>·</span><span>TTD {campaign.budgetTTD.toLocaleString()}</span><span>·</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{campaign.startDate}</span></div>{!viewOnly && <Button variant="outline" size="sm" onClick={() => void handleToggle(campaign)}>{campaign.status === "Active" ? "Mark completed" : "Reactivate"}</Button>}</CardContent></Card>)}</div> : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{campaigns.length ? "No campaigns match these filters." : "No saved campaigns yet. Create one to start planning."}</div>}
      </div>
    </main>
  );
}
