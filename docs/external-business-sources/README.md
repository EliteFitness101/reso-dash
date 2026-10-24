# ResoFit External Business Sources

Canonical database: Supabase project `resonance-fitness` (`vbqjvmnhdtdhmeeudqnn`).

## Managed source classes
- Gyms, fitness studios, trainers, pools and recreation centres
- Wellness clinics, spas, massage, physiotherapy and rehabilitation
- Nutrition, supplements, healthy food and sports nutrition
- Equipment suppliers, distributors, wholesalers and merchant catalogs
- Booking providers, hospitality, corporate wellness and service marketplaces
- External API, directory, Google Business and social acquisition sources

## Metadata schema
`resofit_external_business_sources` stores identity, category, geography, postcode, public website and booking URLs, published organizational email/phone/WhatsApp, public social links, Google Business references, services, commerce capabilities, source evidence, verification state, partnership state, ingest state and timestamps.

## Evidence rules
- Store only public business contact channels; do not infer private employee contacts.
- Preserve source URL and observed timestamp for each extracted field.
- Unknown fields remain NULL; never fabricate postcode, WhatsApp, Google Business or social URLs.
- `discovered` is not `verified`; `prospect` is not `partner`.
- Scraped contacts require human review before outreach. Honor consent, lawful basis and opt-out rules.
- Firecrawl API key remains server-side in Supabase secrets. Never place it in browser code.

## Operational flow
1. Discover source URLs with the authenticated Firecrawl gateway.
2. Review and import candidate sources.
3. Scrape official pages and extract published contact metadata.
4. Review contact evidence and deduplicate.
5. Verify provider identity and services.
6. Contact/onboard only through approved workflows.
7. Re-check metadata and endpoints on a schedule.

## Related endpoints
- Firecrawl gateway: `https://vbqjvmnhdtdhmeeudqnn.supabase.co/functions/v1/firecrawl-intelligence-gateway`
- V12 dashboard: `https://vbqjvmnhdtdhmeeudqnn.supabase.co/functions/v1/v12-engine-dashboard`
- Commerce ingestion: `https://xtgteviwtoupbfvorrmk.supabase.co/functions/v1/resoflex-commerce-intelligence`
- CEO Growth dashboard: `https://dashboard.resofit.fit/ceo-growth`
- V12 dashboard: `https://dashboard.resofit.fit/v12-engine`
- External sources route planned for Reso-Dash: `/external-sources`
