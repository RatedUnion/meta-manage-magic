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

type Row = {
  id: string;
  title: string;
  target_audience: string;
  channel: string;
  budget_ttd: number;
  status: string;
  start_date: string;
};

const toItem = (r: Row): CampaignItem => ({
  id: r.id,
  title: r.title,
  targetAudience: r.target_audience,
  channel: r.channel,
  budgetTTD: Number(r.budget_ttd),
  status: r.status as CampaignItem["status"],
  startDate: r.start_date,
});

const createCampaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  targetAudience: z.string().min(3).max(200),
  channel: z.string().min(2).max(100),
  budgetTTD: z.number().min(0).max(100000),
  startDate: z.string().min(8),
});

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignItem[]> => {
    const { data, error } = await context.supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load campaigns");
    return (data as Row[]).map(toItem);
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createCampaignSchema.parse(data))
  .handler(async ({ data, context }): Promise<CampaignItem> => {
    const { data: row, error } = await context.supabase
      .from("campaigns")
      .insert({
        title: data.title,
        target_audience: data.targetAudience,
        channel: data.channel,
        budget_ttd: data.budgetTTD,
        start_date: data.startDate,
        status: "Active",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error || !row) throw new Error("Could not save campaign");
    return toItem(row as Row);
  });

export const toggleCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["Active", "Draft", "Completed"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("campaigns")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error("Could not update campaign");
    return { ok: true, id: data.id, status: data.status };
  });
