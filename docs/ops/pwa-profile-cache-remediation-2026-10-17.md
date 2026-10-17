# ResoFlex PWA and profile-cache remediation — 2026-10-17

## Changes in this review branch
- Registers a service worker from the root app component.
- Adds a conservative worker that caches only same-origin versioned/static script, style, font, and image assets.
- Never caches API/auth/storage endpoints, POSTs, or navigation HTML. Offline navigation falls back to a static page that explains that account data and payments require a connection.
- Removes the legacy localStorage profile cache on app startup and no longer persists subscriber profiles/intake locally.
- Clears in-memory profile state and legacy localStorage keys when the authenticated Supabase user identity changes, including sign-out/account switching.

## Deliberate limits
- This is not a complete offline customer app. It provides static-asset caching and a safe offline fallback only.
- It does not add Auth0 or Shopify Customer Account integration. The inspected dashboard currently uses Supabase magic links and MFA and redirects `/` to `/v12-engine`; customer-facing identity architecture must be selected and tested separately.
- The service worker does not cache personalized HTML, payment pages, customer entitlements, or profile API responses.

## Acceptance checks
1. Build and lint the branch.
2. In browser devtools, verify `/sw.js` registers under HTTPS and old `resoflex-static-*` caches are removed on activation.
3. Load the dashboard online, confirm hashed assets are cached, then go offline and confirm navigation shows `offline.html`.
4. Confirm no request to `/auth/v1/`, `/rest/v1/`, `/storage/v1/`, or function endpoints appears in Cache Storage.
5. Save a test profile, sign out, then sign in as another test user; confirm `resoflex.subscribers.v1` and `resoflex.subscribers.current.v1` are absent and no prior profile appears.
6. Verify sign-in, MFA, checkout, and post-payment profile/intake flows are not broken before merging. Profile/intake data is now memory-only and will not survive a full reload until server-backed, user-scoped persistence is implemented; confirm that is acceptable for the interim.

## Release status
Review-only. No production deployment, identity-provider registration, schema/data change, or live customer session test was performed.
