# ResoFit OS / CoachB2K — Advanced Product Specification

## Product direction

ResoFit PWA is the mobile-first wellness and lifestyle utility layer across the ResoFit ecosystem. CoachB2K™ is the user's personalized coaching and orchestration interface: **"Your wellness coach with you, for you — understanding your wellness and lifestyle needs."**

This document is a product architecture/specification, not a claim that every capability is currently implemented.

## Adaptive member onboarding

Onboarding should progressively collect only information needed to personalize the experience:

1. Welcome / value proposition
2. Age band and preferred experience density
3. Goals: fitness, mobility, strength, weight management, healthy ageing, confidence, nutrition, martial arts, recovery, lifestyle habits
4. Training level and available equipment
5. Dietary preferences, allergies and culturally relevant food preferences
6. Schedule, timezone and reminder preferences
7. Accessibility preferences
8. Device capability consent: notifications, microphone, camera, calendar
9. Coaching style: direct, gentle, technical, motivational, concise
10. Safety acknowledgement and escalation preferences

Never require sensitive health information when it is not necessary for the selected feature.

## Premium adaptive visual system

Use glassmorphism without sacrificing readability:

- Obsidian/noir base
- metallic-gold primary accent
- translucent glass cards with backdrop blur
- subtle architectural grid
- responsive motion and Framer Motion transitions
- reduced-motion mode
- high-contrast mode
- large-text mode
- screen-reader labels
- keyboard/focus support

### Dynamic personalization

Visual personalization can respond to **user-selected** or non-sensitive profile attributes such as age band, preferred theme and coaching mode.

Do not infer gender identity or medical status from appearance. If gender-specific visual themes are offered, make them optional preferences and never a gate for functionality.

## Accessibility / device settings center

Provide an in-app settings surface for:

- light / dark / system theme
- contrast
- font size
- reduced motion
- haptic preference where supported
- notification permission/status
- microphone permission/status
- camera permission/status
- calendar integration status
- voice input language
- data export/delete controls

Respect OS settings first and progressively enhance.

## Meal intelligence

### Meal cards

Premium Framer Motion meal cards should show:

- meal timing
- Nigerian/local food alternatives
- portion guidance
- protein/carbohydrate/fat summary
- preparation time
- shopping list action
- substitutions based on declared preferences/restrictions
- save/favorite
- add to daily agenda
- CoachB2K explanation: "Why this meal today"

### Nigeria-first nutrition library

Build a culturally relevant catalog including configurable examples such as:

- beans and rice combinations
- jollof-style meals
- yam and plantain options
- oats and egg breakfasts
- moi moi
- vegetable soups and controlled swallow portions
- grilled fish/chicken
- pepper soup variants
- fruits, nuts and local snacks

The engine should personalize portions and substitutions from the user's goals and declared dietary constraints. It must not present medical treatment claims.

## Training / movement cards

Every workout card can include:

- exercise video/instruction
- sets/reps/time
- tempo
- rest timer
- progression history
- equipment requirements
- home/gym alternatives
- accessibility modifications
- age-appropriate intensity options
- completion logging
- CoachB2K voice guidance

## Daily accountability

Daily flow:

```text
Morning agenda
  ↓
Movement / nutrition / hydration / habit actions
  ↓
Quick check-in
  ↓
CoachB2K adjustment
  ↓
Evening reflection
  ↓
Weekly trend
```

Keep accountability supportive rather than punitive. Avoid shame-based streak mechanics.

## Lifestyle habit tracker

Track user-selected habits such as:

- sleep routine
- hydration
- movement
- meal consistency
- screen breaks
- recovery
- smoking reduction goals
- alcohol reduction goals
- stress-management routines
- social connection

### Substance-use support boundary

CoachB2K may help users track goals, triggers, routines and support resources for smoking/alcohol reduction. It must not diagnose dependence or provide unsafe withdrawal protocols.

For potentially dangerous withdrawal or dependence, the product should recommend professional medical assessment rather than giving a DIY detox protocol.

## CoachB2K interaction model

Supported commands include:

- "What is my plan today?"
- "Move my workout to 6 PM."
- "Remind me to drink water."
- "What Nigerian dinner fits my plan?"
- "Log my check-in."
- "Start my mobility session."
- "Show my progress this week."
- "Help me stay on track with my smoking reduction goal."

Actions that affect external systems require confirmation when appropriate.

## Martial-X / martial.resofit.fit

Add the martial-arts experience as a dedicated ecosystem layer with a future route/domain target:

- `martial.resofit.fit`

Curriculum should be inclusive of:

- African martial arts and combat traditions
- boxing
- kickboxing
- karate
- judo
- taekwondo
- Brazilian jiu-jitsu
- wrestling
- Muay Thai
- Tai Chi
- mobility / movement arts
- conditioning
- self-defence education

"Cobra Konfu" should be treated as a ResoFit branded training program/name only where legally appropriate and clearly distinguished from established martial-arts disciplines.

### Age-aware martial programming

- children/young users: supervised, technique-first, age-appropriate play and conditioning
- adults: skill + conditioning + strength
- older adults: balance, mobility, controlled Tai Chi and low-impact movement

Avoid prescribing unsafe combat intensity without qualified supervision.

## Senior / caregiver experience

Dedicated modes for:

- seniors
- family caregivers
- professional home caregivers

Features:

- medication/reminder placeholders with professional-care boundaries
- mobility routines
- hydration/meal reminders
- appointment preparation
- caregiver task list
- check-in escalation
- trusted-contact workflow

## Professional care escalation

Provide request flows for:

- nutritionist consultation
- physiotherapy/mobility consultation
- nurse/home-care request
- doctor referral/recommendation
- home visit request where service availability permits

These are **service-request workflows**, not autonomous medical diagnosis.

Escalation architecture:

```text
User signal / concern
       ↓
CoachB2K identifies that professional support may be appropriate
       ↓
User confirms request
       ↓
Qualified professional queue
       ↓
Human review
       ↓
Appointment / home-care workflow
```

## ResoFlex G4 / connected equipment

Future connected-equipment architecture:

```text
ResoFlex G4 device
      ↓
Bluetooth / supported device bridge
      ↓
Consent + device identity
      ↓
ResoFit telemetry service
      ↓
User dashboard
      ↓
CoachB2K trends
      ↓
Professional review (when explicitly requested)
```

Potential data: repetitions, resistance/load, session duration and other device-supported metrics.

Do not claim that equipment "heals" a spinal condition or replace clinical treatment. A prior personal experience with cervical-spine improvement can be represented as a **user story only after appropriate consent and without medical efficacy claims**.

For X-ray/medical imaging data, use a secure professional-review workflow. CoachB2K should not independently diagnose an X-ray.

## Ecosystem map

### Gateway

- `resofit.fit`

### Experience / product layers

- `shop.resofit.fit` — commerce/store
- `chatb2k.resofit.fit` — CoachB2K experience where applicable
- `martial.resofit.fit` — Martial-X
- `elite.resofit.fit` — premium coaching
- `bellyfat.resofit.fit` — Reset funnel

All active domains should be maintained from a single canonical route/domain registry. Retired domains must not be reintroduced accidentally.

### Ecosystem capabilities

- Wellness programs
- Personalized nutrition
- Training
- Mobility / longevity
- Martial-X
- ResoFlex equipment/apparel
- Digital guides
- Learning platform
- Personal trainer/coaching
- Shop/store
- Member dashboard
- Referral dashboard
- Upsells / bundles
- Community
- Careers / business / support
- CoachB2K

## Commercial architecture

```text
Traffic
 ↓
Content / SEO / social
 ↓
Personalized onboarding
 ↓
CoachB2K value moment
 ↓
Free utility
 ↓
Offer / program / product
 ↓
Paystack
 ↓
Verified payment
 ↓
Entitlement
 ↓
Immediate fulfillment
 ↓
Upsell / membership
 ↓
Referral
 ↓
Retention
```

### Member dashboard

- active program
- daily agenda
- progress
- meal plan
- workout plan
- habit tracker
- CoachB2K
- purchases
- digital library
- appointments
- referrals
- rewards

### Shop dashboard

- products
- collections
- apparel
- equipment
- digital guides
- bundles
- order history
- recommendations

### Referral dashboard

- referral link/code
- clicks
- conversions
- pending commission
- available balance
- payout status
- referral education

## Automation layer

Use a durable server-side job model for reminders and automation:

```text
CoachB2K action
 ↓
intent validation
 ↓
user confirmation / consent
 ↓
idempotent job
 ↓
queue/scheduler
 ↓
notification channel
 ↓
delivery receipt
 ↓
completion event
```

Channels may include in-app notifications, web push where supported, email, WhatsApp and calendar events.

## Security and privacy

- no secrets in client code
- explicit permissions for microphone/camera/calendar
- least-privilege backend access
- encrypted sensitive records at rest/in transit through platform controls
- audit trail for professional-care requests
- consent records
- data deletion/export controls
- never expose another member's health/profile data

## Implementation sequence

### P0

1. adaptive onboarding shell
2. settings/accessibility center
3. premium meal/workout cards
4. daily accountability
5. habit tracker
6. CoachB2K command surface

### P1

7. Nigeria meal personalization engine
8. calendar `.ics` + supported calendar integrations
9. reminders/notifications
10. referral + shop dashboards
11. digital guide/library layer

### P2

12. Martial-X experience
13. senior/caregiver mode
14. professional-service request workflows
15. camera/voice utilities
16. connected equipment abstraction

### P3

17. native companion for deeper OS integration
18. advanced equipment telemetry
19. professional review portal
20. ecosystem-wide personalization graph

## Non-negotiable quality gates

- responsive on iPhone-class devices
- WCAG-minded contrast/focus/labels
- reduced-motion support
- no medical diagnosis claims
- no unsafe withdrawal instructions
- no autonomous clinical decisions
- consent before device access
- payment remains server-authoritative
- no PWA cache of payment/authenticated API responses
- every external automation is auditable and idempotent
- feature flags for unfinished integrations
- production deployment only after build, route, browser and payment smoke tests
