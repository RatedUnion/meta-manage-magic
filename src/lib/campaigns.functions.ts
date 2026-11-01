import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CampaignItem {
  id: string;
  title: string;
  targetAudience: string;
  channel: string;
  budgetTTD: number;
  status: "Active" | "Draft" | "Completed";
  startDate: string;
}

const DEFAULT_CAMPAIGNS: CampaignItem[] = [
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
];

const createCampaignSchema = z.object({
  title: z.string().min(3).max(120),
  targetAudience: z.string().min(3).max(200),
  channel: z.string().min(2).max(100),
  budgetTTD: z.number().min(0).max(100000),
  startDate: z.string().min(8),
});

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<CampaignItem[]> => {
    return DEFAULT_CAMPAIGNS;
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createCampaignSchema.parse(data))
  .handler(async ({ data }): Promise<CampaignItem> => {
    const newCamp: CampaignItem = {
      id: "camp-" + Math.random().toString(36).substring(2, 9),
      title: data.title,
      targetAudience: data.targetAudience,
      channel: data.channel,
      budgetTTD: data.budgetTTD,
      status: "Active",
      startDate: data.startDate,
    };
    return newCamp;
  });

export const toggleCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string(), status: z.enum(["Active", "Draft", "Completed"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    return { ok: true, id: data.id, status: data.status };
  });
