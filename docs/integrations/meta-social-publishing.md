# Meta (Facebook Pages) publishing — implementation and setup

Facebook Page publishing is the first social integration. These Supabase Edge Functions keep OAuth credentials and Page access tokens server-side; they never return access tokens to the browser. The app already uses Supabase Auth, so each endpoint requires a signed-in administrator.

## Deployment order

1. Facebook Page OAuth and text publishing (implemented here).
2. Verify end-to-end publishing with a Meta app in development mode and a test Page.
3. Add Instagram only after Facebook is verified; require an eligible Instagram professional account and the supported Meta account linkage/permissions.
4. Keep LinkedIn disabled until the app has the necessary approved API access and scopes.

The `meta-connections` response reports Instagram and LinkedIn as deferred. No Instagram or LinkedIn publishing is enabled by these files. Existing unrelated booking/calendar integrations are unchanged.

## Meta developer setup

1. Create/configure a Meta developer app with Facebook Login and the Pages API products/permissions currently required by Meta. Request only `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts` for this publishing flow. Meta may require app review, business verification, and/or advanced access before production use.
2. Register the exact `META_REDIRECT_URI` in the Meta app. It must be `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/meta-oauth-callback` and match exactly at authorization and code exchange.
3. Set Edge Function secrets (never commit these values):

```sh
supabase secrets set META_APP_ID=... META_APP_SECRET=... META_REDIRECT_URI=... META_GRAPH_API_VERSION=... META_APP_URL=https://meta-manage-magic.lovable.app META_ALLOWED_ORIGINS=https://meta-manage-magic.lovable.app META_TOKEN_ENCRYPTION_KEY=...
