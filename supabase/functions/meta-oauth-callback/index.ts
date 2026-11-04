import { encryptToken, sha256 } from "../_shared/crypto.ts";
import { adminClient, appRedirect, metaConfig } from "../_shared/meta.ts";

function redirect(result: "connected" | "error", reason?: string, detail?: unknown) {
  console.log(`meta-oauth-callback result=${result} reason=${reason ?? "none"} detail=${typeof detail === "string" ? detail.slice(0, 200) : ""}`);
  return Response.redirect(appRedirect(result, reason), 302);
}

Deno.serve(async (request) => {
  if (request.method !== "GET") return redirect("error", "invalid_callback");
  const params = new URL(request.url).searchParams;
  if (params.has("error") || params.has("error_reason")) return redirect("error", "authorization_denied");
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || code.length > 4096 || state.length !== 64) return redirect("error", "invalid_callback");

  try {
    const admin = adminClient();
    const stateHash = await sha256(state);
    const { data: stateRow, error: stateError } = await admin.from("meta_oauth_states")
      .update({ used_at: new Date().toISOString() })
      .eq("state_hash", stateHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("user_id")
      .maybeSingle();
    if (stateError || !stateRow) return redirect("error", "state_expired");

    const { appId, appSecret, redirectUri, version } = metaConfig();
    const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
    tokenUrl.search = new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }).toString();
    const shortTokenResponse = await fetch(tokenUrl, { signal: AbortSignal.timeout(10_000) });
    const shortToken = await shortTokenResponse.json();
    if (!shortTokenResponse.ok || typeof shortToken.access_token !== "string") return redirect("error", "token_exchange_failed");

    const longUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
    longUrl.search = new URLSearchParams({ grant_type: "fb_exchange_token", client_id: appId, client_secret: appSecret, fb_exchange_token: shortToken.access_token }).toString();
    const longResponse = await fetch(longUrl, { signal: AbortSignal.timeout(10_000) });
    const longToken = await longResponse.json();
    if (!longResponse.ok || typeof longToken.access_token !== "string") return redirect("error", "token_exchange_failed");

    const pagesUrl = new URL(`https://graph.facebook.com/${version}/me/accounts`);
    pagesUrl.search = new URLSearchParams({ fields: "id,name,access_token", limit: "100", access_token: longToken.access_token }).toString();
    const pagesResponse = await fetch(pagesUrl, { signal: AbortSignal.timeout(10_000) });
    const pagesPayload = await pagesResponse.json();
    if (!pagesResponse.ok || !Array.isArray(pagesPayload.data)) return redirect("error", "page_access_unavailable");
    if (pagesPayload.data.length === 0) return redirect("error", "no_pages_available");

    const userExpiresAt = Number.isFinite(longToken.expires_in) && longToken.expires_in > 0
      ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
      : null;
    for (const page of pagesPayload.data) {
      if (typeof page.id !== "string" || typeof page.name !== "string" || typeof page.access_token !== "string") continue;
      const { error } = await admin.from("meta_connections").upsert({
        user_id: stateRow.user_id,
        page_id: page.id,
        page_name: page.name.slice(0, 200),
        token_ciphertext: await encryptToken(page.access_token),
        token_expires_at: page.expires_at ? new Date(Number(page.expires_at) * 1000).toISOString() : userExpiresAt,
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,page_id" });
      if (error) return redirect("error", "connection_save_failed");
    }
    return redirect("connected");
  } catch {
    // Never log provider payloads or credentials; only redirect a generic code to the app.
    return redirect("error", "connection_failed");
  }
});
