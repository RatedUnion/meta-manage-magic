import { authFailure, handleOptions, json, requireAdmin } from "../_shared/meta.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return handleOptions(request);
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  try {
    const { userId, admin } = await requireAdmin(request);
    const input = await request.json();
    if (!input || typeof input.connectionId !== "string") return json(request, { error: "Facebook Page connection required." }, 400);
    const { error } = await admin.from("meta_connections").delete().eq("id", input.connectionId).eq("user_id", userId);
    if (error) throw new Error("Connection could not be removed");
    return json(request, { disconnected: true });
  } catch (error) {
    return authFailure(request, error);
  }
});
