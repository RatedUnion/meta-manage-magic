import { authFailure, handleOptions, json, metaConfig, requireAdmin } from "../_shared/meta.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return handleOptions(request);
  if (request.method !== "GET") return json(request, { error: "Method not allowed." }, 405);
  try {
    const { userId, admin } = await requireAdmin(request);
    const { data, error } = await admin.from("meta_connections")
      .select("id,page_id,page_name,status,token_expires_at,updated_at")
      .eq("user_id", userId)
      .order("page_name");
    if (error) throw new Error("Connections unavailable");
    const version = Deno.env.get("META_GRAPH_API_VERSION");
    return json(request, {
      facebookPages: data ?? [],
      instagram: { status: "deferred", available: false, reason: "Enable after Facebook publishing has been verified and eligible professional accounts are confirmed." },
      linkedin: { status: "deferred", available: false, reason: "Requires approved API access and permissions." },
      metaApiConfigured: Boolean(version && /^v\d+\.\d+$/.test(version)),
    });
  } catch (error) {
    return authFailure(request, error);
  }
});
