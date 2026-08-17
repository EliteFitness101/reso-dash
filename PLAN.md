# ResoFit PWA / CoachB2K — Product & Architecture Plan

## Vision

**CoachB2K™ — Your wellness coach with you, for you.**

A mobile-first ResoFit wellness and lifestyle utility that understands a user's goals, routines, preferences, program, activity and consented signals, then turns them into practical daily actions, reminders and adaptive coaching.

## Product promise

> Understand your wellness and lifestyle needs, help you act on them, and stay with you through the day.

The PWA is the **experience layer**. CoachB2K is the **personal coaching/orchestration layer**. ResoFit services remain the authoritative layer for identity, plans, payments, products, programs, analytics and fulfillment.

## Current foundation

- TanStack Start + TanStack Router
- Mobile-first dashboard
- Macro Engine
- Hybrid Training Matrix
- Sunday biometric check-in
- Industrial Luxe Noir + Gold design system
- PWA manifest
- Service-worker foundation (`public/sw.js`)

## Target architecture

```text
Device
  │
  ├── PWA UI / Dashboard
  ├── Calendar
  ├── Notifications / reminders
  ├── Voice input
  ├── Camera / photo capture
  └── Install / app lifecycle
          │
          ▼
   CoachB2K™ Orchestrator
          │
   ┌──────┼────────┬───────────┐
   ▼      ▼        ▼           ▼
Profile  Plans   Activity   Preferences
   │      │        │           │
   └──────┴────────┴───────────┘
                 │
                 ▼
          ResoFit Platform
    Auth / Supabase / Payments
    Programs / Shop / CRM / Analytics
```

## Calendar integration

Use progressive enhancement:

1. **Phase 1:** downloadable `.ics` events and calendar deep links.
2. **Phase 2:** Calendar API integration where the platform/browser and user account permit it.
3. Never assume a PWA can silently read or write a device calendar. Require explicit user consent and supported APIs.
4. CoachB2K can propose events such as workouts, meals, hydration checks, recovery and Sunday check-ins.

## Reminders and automation

### Local device

- Web Notifications API where permission is granted.
- Scheduled reminders should use a server-backed scheduler/queue when reliable background timing is required.
- LocalStorage is for UI/demo preferences, not authoritative reminders.

### ResoFit automation

```text
CoachB2K recommendation
      ↓
User confirmation
      ↓
Automation job
      ↓
Notification / WhatsApp / email / calendar event
      ↓
Completion signal
      ↓
CoachB2K adapts next action
```

Never send messages or create calendar events without an explicit user-controlled consent state.

## Voice / Siri / assistants

### Voice input

Use progressive enhancement with `SpeechRecognition` / `webkitSpeechRecognition` where available. Provide typed input fallback.

Example intents:

- “CoachB2K, what is my workout today?”
- “Remind me to train at 6 PM.”
- “Log my weight as 82 kilos.”
- “What should I eat for dinner?”
- “Start my recovery check-in.”

### Siri / OS assistants

A web PWA cannot guarantee arbitrary Siri integration. Design an assistant bridge using supported OS/browser capabilities:

- Web Share / share targets where available.
- App shortcuts / native wrapper in a later iOS/Android shell if deeper Siri/Google Assistant integration is required.
- Voice input inside CoachB2K as the universal baseline.

## Camera

Use `MediaDevices.getUserMedia()` only after explicit user action and permission.

Potential wellness utilities:

- meal/photo logging
- progress-photo capture
- document/photo capture for program onboarding
- form/technique capture where appropriate

Camera data should be minimized, consented, securely uploaded when needed, and never treated as a diagnostic system by default.

## Wellness safety boundary

CoachB2K is a wellness/lifestyle coach, not an emergency, diagnostic or medical decision system. High-risk health situations should route users to qualified healthcare professionals and appropriate local services.

## Personalization model

CoachB2K context should be structured rather than sending the entire profile to every request:

```ts
interface CoachContext {
  userId: string;
  goals: string[];
  activeProgram?: string;
  schedule?: { day: string; time?: string }[];
  dietaryPreferences?: string[];
  trainingPreferences?: string[];
  recentCheckIn?: {
    weightKg?: number;
    waistCm?: number;
    energy?: number;
    recordedAt: string;
  };
  consent: {
    notifications: boolean;
    calendar: boolean;
    voice: boolean;
    camera: boolean;
  };
}
```

## Data architecture

### Device-only

- UI state
- install/dismiss preference
- temporary voice state
- temporary camera capture

### Supabase authoritative data

- authenticated profile
- assessment answers
- program enrollment
- check-in history
- goals/preferences
- consent records
- reminder jobs
- coaching events

### Server-side orchestration

- CoachB2K actions
- reminder scheduling
- calendar-event generation
- notification dispatch
- email/WhatsApp automation
- analytics and attribution

## Offline/PWA strategy

The service worker is intentionally conservative:

- cache app shell/static same-origin resources
- network-first navigation
- cache-first static assets
- no payment responses cached
- no authenticated API responses cached by default
- no Supabase mutations handled offline without a dedicated sync protocol

Future offline sync should use an explicit queue with idempotency keys and conflict handling.

## Payments

The PWA must not make the browser the authority for payment status.

```text
PWA CTA
  ↓
Server-side payment initialization
  ↓
Paystack
  ↓
Verified webhook
  ↓
Supabase payment/order state
  ↓
Entitlement / fulfillment
```

Do not cache payment pages or sensitive transaction responses in the service worker.

## Notifications and reminder policy

Every automated action should have:

- purpose
- user consent
- timezone
- schedule
- cancellation path
- idempotency key
- delivery status
- audit timestamp

## Growth utility layer

CoachB2K should gradually support:

- daily wellness agenda
- meal planning
- training planning
- hydration prompts
- sleep/recovery routines
- habit streaks
- weekly check-ins
- progress summaries
- product/program recommendations
- appointment/calendar coordination
- WhatsApp/email follow-up
- referral and loyalty prompts

Recommendations must remain transparent and user-controllable.

## Product evolution

### P0 — Foundation

- service worker registration
- manifest/install lifecycle
- offline-safe shell
- consent center
- CoachB2K chat/voice entry
- typed/voice command routing

### P1 — Personal utility

- reminder engine
- calendar `.ics` export/deep links
- check-in persistence
- daily agenda
- notification preferences

### P2 — Connected ecosystem

- server-backed reminders
- WhatsApp/email automation
- calendar account integrations where supported
- camera-based logging
- richer CoachB2K memory/context

### P3 — Native companion

If deeper OS integration becomes commercially justified:

- iOS/Android wrapper
- Siri/App Shortcuts
- native push notifications
- native calendar access
- background sync
- health-platform integrations subject to consent and platform policy

## Engineering rules

1. Mobile-first.
2. Progressive enhancement: browser capability is never assumed.
3. Consent before device access.
4. No secrets in the client.
5. Payment state is server-authoritative.
6. Personal data is minimized.
7. Service worker must never cache authenticated financial responses.
8. Every automation action is idempotent.
9. CoachB2K recommendations are explainable and user-controllable.
10. Keep the PWA experience useful even when calendar, microphone, camera or notifications are unavailable.

## Acceptance criteria

- App installs where supported.
- Dashboard works without network for the cached shell.
- Payment flow remains network-only and never serves stale payment state.
- User can enable/disable reminders.
- User can add a workout/check-in to a calendar through a supported mechanism.
- Voice input gracefully falls back to text.
- Camera gracefully falls back to file upload or no-camera workflow.
- CoachB2K can answer current-plan questions from authoritative user context.
- All device capabilities have visible consent and settings controls.
- No production deployment occurs until CI/browser smoke tests pass.
