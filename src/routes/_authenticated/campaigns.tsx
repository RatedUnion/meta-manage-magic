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

interface CampaignItem {
  id: string;
  title: string;
  targetAudience: string;
  channel: string;
  budgetTTD: number;
  status: "Active" | "Draft" | "Completed";
  startDate: string;
}

function CampaignsPage() {
  const [campaigns] = useState<CampaignItem[]>([
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
              Seasonal & Location Campaigns
            </h1>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Campaign
          </Button>
        </div>

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
                <div className="flex justify-between pt-2 border-t text-xs">
                  <span>Budget: TTD ${camp.budgetTTD.toLocaleString()}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Starts {camp.startDate}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
