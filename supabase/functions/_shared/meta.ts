import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AuthContext = {
  userId: string;
  // deno-lint-ignore no-explicit-any
  admin: SupabaseClient<any, any, any>;
};

// deno-lint-ignore no-explicit-any
export function adminClient(): SupabaseClient<any, any, any> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Server configuration unavailable");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("META_ALLOWED_ORIGINS") ?? "https://meta-manage-magic.lovable.app,http://localhost:5173")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "https://meta-manage-magic.lovable.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function handleOptions(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}



export async function requireAdmin(request: Request): Promise<AuthContext> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error("Unauthorized");

  const url = Deno.env.get("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !publicKey) throw new Error("Server configuration unavailable");
  const authClient = createClient(url, publicKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Unauthorized");

  const admin = adminClient();
  const { data: isAdmin, error } = await admin.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Forbidden");
  return { userId: userData.user.id, admin };
}

export function authFailure(request: Request, error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return json(request, { error: status === 401 ? "Sign in required." : status === 403 ? "Administrator access required." : "Integration request could not be completed." }, status);
}

export function metaConfig() {
  const appId = Deno.env.get("META_APP_ID");
  const appSecret = Deno.env.get("META_APP_SECRET");
  const redirectUri = Deno.env.get("META_REDIRECT_URI");
  const version = Deno.env.get("META_GRAPH_API_VERSION");
  if (!appId || !appSecret || !redirectUri || !version) throw new Error("Meta integration is not configured");
  if (!/^v\d+\.\d+$/.test(version)) throw new Error("Meta integration is not configured");
  return { appId, appSecret, redirectUri, version };
}

export function appRedirect(result: "connected" | "error", reason?: string) {
  const base = Deno.env.get("META_APP_URL") ?? "https://meta-manage-magic.lovable.app";
  const url = new URL("/admin/integrations", base);
  url.searchParams.set("meta", result);
  if (reason) url.searchParams.set("reason", reason);
  return url.toString();
}
