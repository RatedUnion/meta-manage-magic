import { handleOptions, json, metaConfig, requireAdmin, authFailure } from "../_shared/meta.ts";
import { sha256 } from "../_shared/crypto.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return handleOptions(request);
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  try {
    const { userId, admin } = await requireAdmin(request);
    const { appId, redirectUri, version } = metaConfig();
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { error } = await admin.from("meta_oauth_states").insert({
      state_hash: await sha256(state),
      user_id: userId,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    if (error) throw new Error("OAuth state could not be created");

    const authorize = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
    authorize.search = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      scope: "pages_show_list,pages_read_engagement,pages_manage_posts",
    }).toString();
    return json(request, { authorizationUrl: authorize.toString() });
  } catch (error) {
    return authFailure(request, error);
  }
});
