# ResoFit Advanced Feature & Delivery Matrix

## Member experience

| Layer | Feature | Delivery |
|---|---|---|
| Onboarding | Adaptive multi-step profile | P0 |
| Onboarding | Goal/program selection | P0 |
| Onboarding | Nutrition preferences | P0 |
| Onboarding | Accessibility/device settings | P0 |
| Personalization | Age-band experience | P0 |
| Personalization | Optional theme/gender preference | P0 |
| CoachB2K | Chat + command center | P0 |
| CoachB2K | Voice input | P1 |
| Accountability | Daily check-in | P0 |
| Habits | Lifestyle tracker | P0 |
| Notifications | Reminder center | P1 |
| Calendar | ICS/deep links | P1 |

## Nutrition

- Nigeria-first meal library
- personalized portions
- meal substitutions
- declared allergy/restriction handling
- meal prep guidance
- shopping-list generation
- premium animated meal cards
- daily macro summary
- CoachB2K "why this meal" explanation

## Training

- gym/home programs
- mobility
- strength
- conditioning
- age-aware modifications
- accessibility modifications
- workout history
- progression
- rest timer
- premium animated workout cards

## Martial-X

Domain target: `martial.resofit.fit`

Programs:

- African-origin martial/combat traditions
- boxing
- kickboxing
- karate
- judo
- taekwondo
- BJJ
- wrestling
- Muay Thai
- Tai Chi
- mobility
- conditioning
- Cobra Konfu branded curriculum where legally appropriate

Age tracks:

- youth / supervised
- adult
- senior / low-impact

## Senior and caregiver

- senior mode
- mobility and balance
- caregiver dashboard
- caregiver task list
- trusted-contact escalation
- home-care request
- nutritionist request
- nurse request
- doctor referral request
- home-call request

These are professional-service workflows, not autonomous medical care.

## Lifestyle support

CoachB2K may support user-defined goals involving:

- smoking reduction
- alcohol reduction
- food habits
- dependency-support tracking
- sleep
- hydration
- movement
- recovery
- stress-management

Withdrawal safety: do not provide dangerous DIY detox instructions. Escalate potentially risky withdrawal to qualified healthcare support.

## Commerce

- ResoFlex apparel
- equipment
- digital guides
- programs
- bundles
- subscriptions/membership
- upsells
- cross-sells
- shop dashboard
- order history
- personalized recommendations

## Growth

Referral dashboard:

- referral link/code
- clicks
- conversions
- commissions
- payout status
- referral education

## Connected ResoFlex G4

Future architecture:

Device → secure bridge → consent → telemetry → ResoFit account → CoachB2K trends → professional review.

Possible metrics depend on actual hardware capabilities. No medical efficacy or healing claims are made by default.

## Professional review

For X-rays, imaging, clinical records or biometric concerns:

User → explicit consent → secure professional review request → qualified professional → recommendations → user dashboard.

CoachB2K must not independently diagnose medical images.

## Ecosystem registry

Canonical gateway:

- `resofit.fit`

Experience/product domains currently represented by the ecosystem specification:

- `shop.resofit.fit`
- `chatb2k.resofit.fit`
- `martial.resofit.fit`
- `elite.resofit.fit`
- `bellyfat.resofit.fit`

Every future domain/subdomain should be registered in a single route/domain registry to prevent stale or retired properties from returning.

## Deliverables

1. onboarding flow
2. adaptive dashboard shell
3. accessibility/device settings
4. meal engine
5. training engine
6. daily accountability
7. habit tracker
8. CoachB2K command layer
9. reminders/calendar
10. Martial-X
11. senior/caregiver mode
12. professional request center
13. commerce/shop dashboard
14. referral dashboard
15. digital learning library
16. connected-equipment abstraction
17. analytics/consent/audit layer

## Release gates

- unit tests
- route tests
- accessibility checks
- mobile browser smoke tests
- PWA install checks where supported
- payment smoke test
- fulfillment smoke test
- notification consent tests
- permission-denied fallback tests
- no production deployment until all applicable gates pass
