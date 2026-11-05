import { decryptToken } from "../_shared/crypto.ts";
import { authFailure, handleOptions, json, metaConfig, requireAdmin } from "../_shared/meta.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return handleOptions(request);
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  try {
    const { userId, admin } = await requireAdmin(request);
    const input = await request.json();
    if (!input || typeof input.connectionId !== "string" || typeof input.message !== "string" || input.message.trim().length < 1 || input.message.length > 63_206) {
      return json(request, { error: "Provide a page and a message within the supported length." }, 400);
    }
    const { data: connection, error: lookupError } = await admin.from("meta_connections")
      .select("id,page_id,token_ciphertext,token_expires_at,status")
      .eq("id", input.connectionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (lookupError || !connection) return json(request, { error: "Facebook Page connection not found." }, 404);
    if (connection.status !== "active") return json(request, { error: "Reconnect the Facebook Page before publishing." }, 409);
    if (connection.token_expires_at && Date.parse(connection.token_expires_at) <= Date.now()) {
      await admin.from("meta_connections").update({ status: "reauthorization_required" }).eq("id", connection.id);
      return json(request, { error: "Facebook authorization expired. Reconnect the Page to continue." }, 409);
    }

    const token = await decryptToken(connection.token_ciphertext);
    const { version } = metaConfig();
    const image = typeof input.imageBase64 === "string" ? input.imageBase64.replace(/^data:image\/png;base64,/, "") : "";
    let response: Response;
    if (image) {
      if (image.length > 8_000_000 || !/^[A-Za-z0-9+/=]+$/.test(image)) {
        return json(request, { error: "The QR image is invalid or too large." }, 400);
      }
      const bytes = Uint8Array.from(atob(image), (c) => c.charCodeAt(0));
      const form = new FormData();
      form.append("caption", input.message.trim());
      form.append("access_token", token);
      form.append("source", new Blob([bytes], { type: "image/png" }), "duaa-qr.png");
      response = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(connection.page_id)}/photos`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30_000),
      });
    } else {
      response = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(connection.page_id)}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ message: input.message.trim(), access_token: token }),
        signal: AbortSignal.timeout(15_000),
      });
    }
    const result = await response.json();
    const providerCode = typeof result?.error?.code === "number" ? result.error.code : null;
    if (!response.ok || typeof result.id !== "string") {
      const requiresReauth = providerCode === 190;
      if (requiresReauth) await admin.from("meta_connections").update({ status: "reauthorization_required" }).eq("id", connection.id);
      await admin.from("meta_publish_events").insert({
        user_id: userId,
        connection_id: connection.id,
        status: requiresReauth ? "reauthorization_required" : "failed",
        provider_error_code: providerCode,
      });
      const rateLimited = [4, 17, 32, 613].includes(providerCode ?? -1);
      return json(request, {
        error: requiresReauth ? "Facebook authorization needs attention. Reconnect the Page." : rateLimited ? "Facebook is rate limiting publishing. Try again later." : "Facebook could not publish this post. Check the Page permissions and content, then try again.",
      }, requiresReauth ? 409 : rateLimited ? 429 : 502);
    }

    const { error: auditError } = await admin.from("meta_publish_events").insert({
      user_id: userId,
      connection_id: connection.id,
      status: "published",
      provider_post_id: result.id,
    });
    if (auditError) return json(request, { error: "Post published, but its audit record could not be saved." }, 502);
    return json(request, { status: "published", postId: result.id });
  } catch (error) {
    return authFailure(request, error);
  }
});
