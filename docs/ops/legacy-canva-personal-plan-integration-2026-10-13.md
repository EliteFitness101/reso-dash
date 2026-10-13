# Legacy Canva Assessment → Reso-Dash Personal Plan Integration

**Audit date:** 2026-10-13  
**Repository:** `EliteFitness101/reso-dash`  
**Status:** Draft implementation PR; not merged or deployed.

## Recovered UX references

- Assessment Guide: `DAGwJ2DK6w4` — `https://www.canva.com/design/DAGwJ2DK6w4/ZNTMv_TDF53eA8-e4iaPwQ/view`
- Workout Plan Generator: `DAGy4jwyw3E` — `https://www.canva.com/design/DAGy4jwyw3E/N0DctLwfM8Nwqfq5gnB2Xg/view`
- Workout Generator Website: `DAHG9VAk3fY` — `https://www.canva.com/design/DAHG9VAk3fY/view`
- Naija Workout Generator: `DAGy5MLESzA` — `https://www.canva.com/design/DAGy5MLESzA/QuJHNksCKLA6UiAYjDOlag/view`
- Personalized Meal Plans: `DAGgQLXq6gw` — `https://www.canva.com/design/DAGgQLXq6gw/9v5z0lpP0rSfXeL3zNg_VQ/view`
- Nigerian Meal Plans: `DAGw2-ZZWLY`; Meal & Workout Planner: `DAGwXUGIKVI`; Workout Log Planner: `DAG6MKlGgNs`.

The Canva designs are legacy visual references, not fillable templates or proof of executable generators. The detailed intake already exists in `src/routes/_shell.onboarding.tsx`; it captures biometrics, goals, restrictions, cuisine, meals/day, location and equipment. The existing `generatePlan()` is a client-side preview only.

## Server-side plan contract

- Authenticate through Supabase Auth.
- Invoke `claim-dashboard-entitlement` to reconcile a verified purchase and retrieve an exact product SKU with a product-specific entitlement.
- Invoke `resofit-personal-plan` with `action=get` to retrieve a previously saved plan, or with the exact SKU and only plan-required intake fields to generate/update a plan. Version 6 checks `resofit_entitlement_states` before either operation and persists generated plans in `resofit_personalized_plans`.
- Display the returned saved plan ID, meal/workout days and shopping list. Never claim success unless the function returns `ok=true` and a `plan_id`.
- The local profile store remains compatibility state only; it does not grant access.

## Known production boundaries

- `claim-dashboard-entitlement` v19 now links only successful, reconciled guest payments whose customer email matches the authenticated user and whose payment is not already linked to another account. The existing payment trigger creates product-specific entitlement states only for SKUs configured in `resofit_entitlement_product_config`.
- Current production read found zero rows in `resofit_entitlement_states` and zero saved personalized plans. The latest successful payment record was for `MX-BASIC-WARRIOR`, not a configured ResoFit digital-plan SKU; other recent ResoFit payment records were pending/expired/cancelled. Therefore no existing user can be used as an end-to-end proof of paid plan fulfillment in this audit.
- The public assessment remains at `www.resofit.fit/me`; this PWA route is the authenticated post-entitlement intake, not a duplicate public assessment.
- The plan generator does not itself prove a downloadable guide/PDF has been created, attached to a SKU/order, watermarked, signed, or delivered. Those remain separate fulfillment requirements.
