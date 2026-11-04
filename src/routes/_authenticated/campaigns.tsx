import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Calendar, Megaphone, ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FacebookPublisher } from "@/components/FacebookPublisher";
import { DeeContentStudio } from "@/components/DeeContentStudio";
import { createCampaign, toggleCampaignStatus, type CampaignItem } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_authenticated/campaigns")({ component: CampaignsPage, head: () => ({ meta: [{ title: "Campaign Planner — DUAA" }] }) });

function CampaignsPage() {
  const addCampaignFn = useServerFn(createCampaign);
  const toggleStatusFn = useServerFn(toggleCampaignStatus);
  const [draftMessage, setDraftMessage] = useState<string | undefined>();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([
    { id: "camp-1", title: "Commercial Generator Transfer Switch Outreach", targetAudience: "Warehouses & Factories (Point Lisas & Macoya)", channel: "WhatsApp & Email", budgetTTD: 1500, status: "Active", startDate: "2026-11-01" },
    { id: "camp-2", title: "Holiday Grounds Maintenance & Illumination", targetAudience: "Residential Compounds (Westmoorings & Maraval)", channel: "Meta Ads & Flyer Drop", budgetTTD: 850, status: "Draft", startDate: "2026-11-15" },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", targetAudience: "", channel: "WhatsApp & Social", budgetTTD: 1200, startDate: new Date().toISOString().slice(0, 10) });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Please enter a campaign title");
    setSubmitting(true);
    try {
      const created = await addCampaignFn({ data: { title: form.title, targetAudience: form.targetAudience || "General Commercial Clients", channel: form.channel, budgetTTD: Number(form.budgetTTD) || 0, startDate: form.startDate } });
      setCampaigns((previous) => [created, ...previous]);
      setIsDialogOpen(false);
      setForm({ title: "", targetAudience: "", channel: "WhatsApp & Social", budgetTTD: 1200, startDate: new Date().toISOString().slice(0, 10) });
      toast.success("Campaign launched successfully");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create campaign"); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (id: string, currentStatus: CampaignItem["status"]) => {
    const nextStatus = currentStatus === "Active" ? "Completed" : "Active";
    try {
      await toggleStatusFn({ data: { id, status: nextStatus } });
      setCampaigns((previous) => previous.map((campaign) => campaign.id === id ? { ...campaign, status: nextStatus } : campaign));
      toast.success(`Campaign marked as ${nextStatus}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to update status"); }
  };

  return <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-5xl space-y-6"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Button variant="outline" size="sm" asChild><Link to="/bookings" className="inline-flex items-center"><ArrowLeft className="mr-1 h-4 w-4"/>Back to Bookings</Link></Button><h1 className="flex items-center gap-2 text-2xl font-bold"><Megaphone className="h-6 w-6 text-primary"/>Seasonal & Location Campaigns</h1></div><Button size="sm" onClick={() => setIsDialogOpen(true)}><Plus className="mr-1 h-4 w-4"/>New Campaign</Button></div>
    <DeeContentStudio onUseDraft={setDraftMessage}/><FacebookPublisher draftMessage={draftMessage}/>
    {isDialogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Create Seasonal Campaign</h2><button type="button" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5"/></button></div><form onSubmit={handleCreate} className="space-y-3"><label className="block text-xs text-muted-foreground">Campaign Title<Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Rainy Season Fleet Inspection"/></label><label className="block text-xs text-muted-foreground">Target Audience<Input value={form.targetAudience} onChange={(event) => setForm({ ...form, targetAudience: event.target.value })} placeholder="e.g. Point Lisas & Port of Spain"/></label><div className="grid grid-cols-2 gap-2"><label className="text-xs text-muted-foreground">Channel<Input value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}/></label><label className="text-xs text-muted-foreground">Budget (TTD)<Input type="number" value={form.budgetTTD} onChange={(event) => setForm({ ...form, budgetTTD: Number(event.target.value) })}/></label></div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit" size="sm" disabled={submitting}>{submitting ? "Launching…" : "Launch"}</Button></div></form></div></div>}
    <div className="grid gap-4 md:grid-cols-2">{campaigns.map((campaign) => <Card key={campaign.id} className="border"><CardHeader className="pb-3"><div className="flex items-start justify-between"><CardTitle className="text-lg">{campaign.title}</CardTitle><Badge variant={campaign.status === "Active" ? "default" : "secondary"}>{campaign.status}</Badge></div></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p><strong className="text-foreground">Audience:</strong> {campaign.targetAudience}</p><p><strong className="text-foreground">Channel:</strong> {campaign.channel}</p><div className="flex items-center justify-between border-t pt-2 text-xs"><span>Budget: TTD ${campaign.budgetTTD.toLocaleString()}</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>Starts {campaign.startDate}</span></div><div className="flex justify-end pt-2"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void handleToggle(campaign.id, campaign.status)}>Mark as {campaign.status === "Active" ? "Completed" : "Active"}</Button></div></CardContent></Card>)}</div>
  </div></div>;
}
