import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MonitorCheckResult = {
  url: string;
  statusCode: number;
  responseTimeMs: number;
  sslValid: boolean;
  dnsResolved: boolean;
  checkedAt: string;
};

function isSafePublicUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    
    const host = parsed.hostname.toLowerCase();
    // Block loopback, RFC 1918 private subnets, and cloud metadata (169.254.x)
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}


export const runSiteDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ url: z.string().url().max(500) }).parse(input))
  .handler(async ({ data }): Promise<MonitorCheckResult> => {
    if (!isSafePublicUrl(data.url)) {
      throw new Error("Invalid destination: Private, local, and metadata endpoints are prohibited.");
    }
    const start = Date.now();
    let statusCode = 0;
    let dnsResolved = false;
    try {
      const res = await fetch(data.url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
      statusCode = res.status;
      dnsResolved = true;
    } catch {
      statusCode = 0;
    }
    return {
      url: data.url,
      statusCode,
      responseTimeMs: Date.now() - start,
      sslValid: dnsResolved && data.url.startsWith("https://"),
      dnsResolved,
      checkedAt: new Date().toISOString(),
    };
  });
