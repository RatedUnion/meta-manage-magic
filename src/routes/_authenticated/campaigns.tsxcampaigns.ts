import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Megaphone, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
  head: () => ({ meta: [{ title: "Campaign Planner — DUAA" }] }),
});

function CampaignsPage() {
  const [campaigns] = useState([
    {
      id: "camp-1",
      title: "Commercial Generator Transfer Switch Outreach",
      targetAudience: "Warehouses & Factories (Point Lisas & Macoya)",
      channel: "WhatsApp & Email",
      budgetTTD: 1500,
      status: "Active",
      startDate: "2026-11-01",
    },
    {
      id: "camp-2",
      title: "Holiday Grounds Maintenance & Illumination",
      targetAudience: "Residential Compounds (Westmoorings & Maraval)",
      channel: "Meta Ads & Flyer Drop",
      budgetTTD: 850,
      status: "Draft",
      startDate: "2026-11-15",
    },
  ]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/bookings"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
            </Button>
            <h1 className="text-2xl font-bold">Seasonal & Location Campaign Planner</h1>
          </div>
          <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Campaign</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((camp) => (
            <Card key={camp.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={camp.status === "Active" ? "default" : "secondary"}>{camp.status}</Badge>
                  <span className="font-semibold text-sm">TTD ${camp.budgetTTD}</span>
                </div>
                <CardTitle className="text-base mt-2 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" /> {camp.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p><strong>Target:</strong> {camp.targetAudience}</p>
                <p><strong>Channels:</strong> {camp.channel}</p>
                <p className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" /> Launch: {camp.startDate}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
