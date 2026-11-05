import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Calendar, Megaphone, ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FacebookPublisher } from "@/components/FacebookPublisher";
import { createCampaign, listCampaigns, toggleCampaignStatus, type CampaignItem } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
  head: () => ({ meta: [{ title: "Campaign Planner — DUAA" }] }),
});

function CampaignsPage() {
  const addCampaignFn = useServerFn(createCampaign);
  const toggleStatusFn = useServerFn(toggleCampaignStatus);

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
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)),
      );
      toast.success(`Campaign marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/bookings" className="inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Bookings
              </Link>
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              Seasonal & Location Campaigns
            </h1>
          </div>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Campaign
          </Button>
        </div>

        <FacebookPublisher />

        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Seasonal Campaign</h2>
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Campaign Title</label>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Rainy Season Fleet Inspection"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Target Audience</label>
                  <Input
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    placeholder="e.g. Point Lisas & Port of Spain"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Channel</label>
                    <Input
                      value={form.channel}
                      onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Budget (TTD)</label>
                    <Input
                      type="number"
                      value={form.budgetTTD}
                      onChange={(e) => setForm({ ...form, budgetTTD: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
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
          {campaigns.map((camp) => (
            <Card key={camp.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{camp.title}</CardTitle>
                  <Badge variant={camp.status === "Active" ? "default" : "secondary"}>
                    {camp.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Audience:</strong> {camp.targetAudience}
                </p>
                <p>
                  <strong className="text-foreground">Channel:</strong> {camp.channel}
                </p>
                <div className="flex justify-between items-center pt-2 border-t text-xs">
                  <span>Budget: TTD ${camp.budgetTTD.toLocaleString()}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Starts {camp.startDate}
                  </span>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => handleToggle(camp.id, camp.status)}
                  >
                    Mark as {camp.status === "Active" ? "Completed" : "Active"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
