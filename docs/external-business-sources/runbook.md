# External Business Source Operations Runbook

## Discovery
Use the authenticated `firecrawl-intelligence-gateway` with the `search` action to discover candidate official business websites. Respect site access controls and robots policies. Do not crawl login-protected systems or bypass anti-bot controls.

## Enrichment
Scrape the official business website and relevant contact/about/booking pages. Store field-level source URL and timestamp in `source_evidence`. Extract only published organizational channels: shared email inboxes, business telephone, published WhatsApp links, public social profiles, booking URLs, postcode and Google Business/Maps links when present. Do not infer missing fields.

## Verification states
- `discovered`: candidate URL returned by search.
- `public_source_checked`: official/public page was retrieved.
- `contact_verified`: at least one contact field was confirmed from its source.
- `business_verified`: identity and service information checked against credible evidence.
- `rejected`: duplicate, irrelevant, misleading or unreachable listing.

## Partnership states
`prospect` → `contacted` → `onboarding` → `contracted` → `active`. Pause or reject when appropriate. Do not promote a listing to active merely because it was scraped or imported.

## CEO access and safety
The UI requires a signed-in admin/super-admin and verified MFA. Keep RLS enabled. Keep Firecrawl/OpenAI/Gemini secrets server-side. Never expose service-role credentials in frontend code. Apply rate limits, idempotency, deduplication, audit logging, and outbound consent/opt-out controls before messaging.

## Acceptance checks
1. Dashboard loads with a CEO session and verified MFA.
2. Non-admin and non-MFA sessions are denied.
3. Search and scrape return provider status and error details without leaking secrets.
4. Imports are idempotent by `source_key`.
5. Metadata updates retain evidence and do not overwrite existing verified fields without review.
6. Contact/booking fields link only to the correct business and source.
7. No source is labelled partner/active without human verification and commercial agreement.
8. CEO-growth and V12 dashboards retain their current access controls.
