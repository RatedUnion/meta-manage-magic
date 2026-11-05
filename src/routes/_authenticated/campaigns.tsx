import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Megaphone, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FacebookPublisher } from "@/components/FacebookPublisher";
import { useViewMode } from "@/lib/view-mode";
import { createCampaign, listCampaigns, toggleCampaignStatus, type CampaignItem } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
  head: () => ({ meta: [{ title: "Campaign Planner — DUAA" }] }),
});

function CampaignsPage() {
  const addCampaignFn = useServerFn(createCampaign);
  const toggleStatusFn = useServerFn(toggleCampaignStatus);
  const { viewOnly } = useViewMode();
  const listFn = useServerFn(listCampaigns);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);

  useEffect(() => {
    listFn()
      .then(setCampaigns)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load campaigns"));
  }, [listFn]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    targetAudience: "",
    channel: "WhatsApp & Social",
    budgetTTD: 1200,
    startDate: new Date().toISOString().slice(0, 10),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Please enter a campaign title");
    setSubmitting(true);
    try {
      const created = await addCampaignFn({
        data: {
          title: form.title,
          targetAudience: form.targetAudience || "General Commercial Clients",
          channel: form.channel,
          budgetTTD: Number(form.budgetTTD) || 0,
          startDate: form.startDate,
        },
      });
      setCampaigns((prev) => [created, ...prev]);
      setIsDialogOpen(false);
      setForm({
        title: "",
        targetAudience: "",
        channel: "WhatsApp & Social",
        budgetTTD: 1200,
        startDate: new Date().toISOString().slice(0, 10),
      });
      toast.success("Campaign launched successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: CampaignItem["status"]) => {
    const nextStatus = currentStatus === "Active" ? "Completed" : "Active";
    try {
      await toggleStatusFn({ data: { id, status: nextStatus } });
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)));
      toast.success(`Campaign marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/bookings" className="inline-flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" />Back to Bookings
              </Link>
            </Button>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Megaphone className="h-6 w-6 text-primary" />Seasonal & Location Campaigns
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/publish">Publish</Link>
            </Button>
            {!viewOnly && (
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />New Campaign
              </Button>
            )}
          </div>
        </div>

        {!viewOnly && <FacebookPublisher />}

        {isDialogOpen && !viewOnly && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Seasonal Campaign</h2>
                <button type="button" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <label className="block text-xs text-muted-foreground">
                  Campaign Title
                  <Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Rainy Season Fleet Inspection" />
                </label>

                <label className="block text-xs text-muted-foreground">
                  Target Audience
                  <Input value={form.targetAudience} onChange={(event) => setForm({ ...form, targetAudience: event.target.value })} placeholder="e.g. Point Lisas & Port of Spain" />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Channel
                    <Input value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Budget (TTD)
                    <Input type="number" value={form.budgetTTD} onChange={(event) => setForm({ ...form, budgetTTD: Number(event.target.value) })} />
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? "Launching…" : "Launch"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{campaign.title}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">{campaign.targetAudience}</p>
                  </div>
                  <Badge variant={campaign.status === "Active" ? "default" : "secondary"}>{campaign.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{campaign.channel}</span>
                  <span>•</span>
                  <span>TTD {campaign.budgetTTD.toLocaleString()}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => void handleToggle(campaign.id, campaign.status)}>
                  Mark as {campaign.status === "Active" ? "Completed" : "Active"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
