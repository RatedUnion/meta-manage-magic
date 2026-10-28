import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MonitorCheckResult {
  url: string;
  statusCode: number;
  responseTimeMs: number;
  sslValid: boolean;
  dnsResolved: boolean;
  checkedAt: string;
}

export const runSiteDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ url: z.string().url() }).parse(data))
  .handler(async ({ data }): Promise<MonitorCheckResult> => {
    const start = Date.now();
    try {
      const response = await fetch(data.url, { method: "HEAD" });
      const duration = Date.now() - start;
      return {
        url: data.url,
        statusCode: response.status,
        responseTimeMs: duration,
        sslValid: data.url.startsWith("https://"),
        dnsResolved: true,
        checkedAt: new Date().toISOString(),
      };
    } catch {
      return {
        url: data.url,
        statusCode: 0,
        responseTimeMs: Date.now() - start,
        sslValid: false,
        dnsResolved: false,
        checkedAt: new Date().toISOString(),
      };
    }
  });
