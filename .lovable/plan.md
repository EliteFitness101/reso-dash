
# ResoFlex OS — Mobile-First Industrial Luxe Dashboard

## Stack note (important)

This project is on **TanStack Start + TanStack Router** (not plain React Router + Vite). The user specified "React Router" — TanStack Router is the routing layer here and behaves equivalently for this app's needs (tab navigation via route files). I'll keep React 19 + Vite + Tailwind as requested and use TanStack Router instead of `react-router-dom`. If you specifically need `react-router-dom`, say so and I'll swap the routing layer.

## PWA note

A full PWA with a service worker would break Lovable's iframe preview. I'll implement the **install prompt UI** (sticky bottom card, real `beforeinstallprompt` lifecycle handling, install/dismiss state, `appinstalled` event) plus a lightweight `manifest.json` with `display: standalone` and icons — enough for "Add to Home Screen" installability. No service worker. This works in production; in the editor preview the prompt simulates (since `beforeinstallprompt` won't fire inside the iframe), matching the request.

## Design system

Update `src/styles.css` tokens (oklch equivalents):
- `--background` #0D0D0D, `--card` #141414, `--border` #262626 (grid lines)
- `--primary` #D4AF37 (metallic gold), `--primary-foreground` #0D0D0D
- `--muted-foreground` warm neutral
- Add gradients: `--gradient-gold` (D4AF37 → B8941F), `--shadow-gold` glow
- Glass utility: `.glass-card` = `bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]`
- Architectural grid backdrop overlay using subtle `#262626` lines
- Typography: display via Space Grotesk (headings/metrics, tabular numerics), body via Inter — loaded from Google Fonts in `__root.tsx` head

Mobile thumb-zone: bottom tab bar with 48px+ hit targets, primary actions in lower 60% of viewport, sticky install banner above tab bar.

## Routes (tabs)

```
src/routes/
  __root.tsx          # update head: viewport, manifest link, theme-color #0D0D0D, fonts
  index.tsx           # redirects to /macros (or renders Macro tab as default)
  _shell.tsx          # layout: header (user context) + <Outlet/> + bottom TabBar + InstallPrompt
  _shell.macros.tsx       # Macro Engine
  _shell.training.tsx     # Hybrid Training Matrix
  _shell.checkin.tsx      # Sunday Biometric Check-In
```

(Underscore pathless layout `_shell` so all tabs share header + bottom nav.)

## Components (src/components/)

- `AppHeader.tsx` — "ResoFlex OS" wordmark, user chip "Maria · NYSC Corper · Week 1/4", subtle progress ring
- `BottomTabBar.tsx` — 3 icons (Utensils, Dumbbell, LineChart), gold active indicator bar
- `InstallPrompt.tsx` — handles `beforeinstallprompt`, `appinstalled`; sticky bottom card above tab bar; dismiss persisted in `localStorage`; falls back to simulated prompt when event unavailable
- `GridBackdrop.tsx` — fixed architectural grid lines overlay
- `MetricTile.tsx` — gold-accented stat card with tabular-nums
- `AlertBanner.tsx` — gold-bordered warning (used for "Zero Onions")
- `MealCard.tsx` — checkable meal with macros breakdown
- `WeekStrip.tsx` — Mon–Sun horizontal scroller with day-type badges (Gym/Home/Rest)
- `ExerciseRow.tsx` — name, sets×reps, tempo chip
- `BurnoutFinisherButton.tsx` — large gold CTA with haptic-style press animation
- `BiometricForm.tsx` — number inputs + 1–10 slider, submit stores to localStorage

## Data (src/lib/user-context.ts)

```ts
export const userProfile = {
  name: "Maria",
  role: "NYSC Corper / Teacher",
  programWeeks: 4,
  currentWeek: 1,
  dietaryRestrictions: ["onions"],
  favorites: { ... },
};
```

Restriction array drives the alert banner dynamically. A `useProgramWeek()` hook (toggle for demo) flips a "Week 3–4 cut" state that scales carb portions −25% on home-training days in the meal cards.

## Macro Engine (`_shell.macros.tsx`)

- Top: dynamic AlertBanner — if `dietaryRestrictions.includes("onions")` → "⚠️ Strict Alert: Zero Onions allowed in food preparation."
- Week toggle (W1–2 / W3–4) — when W3–4 active, MealCards show carb portion at 75% with strikethrough original
- 3 MealCards:
  - Breakfast — Eggs + Whole Wheat Toast / Plantain
  - Lunch — Onion-Free Spiced Beans + Grilled Chicken/Fish
  - Dinner — Low-Oil Egusi (minimal swallow) OR onion-free pepper soup (segmented control)
- Daily macro totals tile (gold)

## Hybrid Training Matrix (`_shell.training.tsx`)

- WeekStrip Mon–Sun. Mon/Thu = Gym (gold dot), Tue/Fri = Home (white dot), Wed/Sat/Sun = Rest/Active
- Selected day expands below:
  - **Gym day**: Progressive Overload list — Lat Pulldowns, Shoulder Press, Leg Press, Cable Tricep superset, Hanging Knee Raises. Each row: target sets×reps + last-session weight placeholder.
  - **Home day**: Circuit list with persistent "3-1-1 Tempo" chip — Incline Dips, Diamond Push-ups (knees), Plank Shoulder Taps, Deadbugs. Sticky BurnoutFinisherButton "Max-Rep Burnout Finisher" → opens timer sheet.

## Sunday Biometric Check-In (`_shell.checkin.tsx`)

- Form: Bodyweight (kg), Waist (cm), Mid-Bicep (cm), Energy slider 1–10 with gold fill
- Submit → toast confirmation, store entry in localStorage with ISO date; show last entry delta

## Install Prompt

```ts
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  setDeferredPrompt(e);
});
window.addEventListener("appinstalled", () => setInstalled(true));
```
- Sticky card above BottomTabBar, gold "Install" button, ghost "Not now" (persists dismissal 7d)
- If no deferred prompt after 1s and not iOS-standalone → show simulated state explaining tap-to-install per browser

## Files added

- `public/manifest.json` (name, short_name "ResoFlex OS", display standalone, theme #0D0D0D, bg #0D0D0D, icons 192/512)
- `public/icon-192.png`, `public/icon-512.png` — generated via imagegen (gold "R" monogram on obsidian)
- Manifest `<link>` + theme-color meta added in `__root.tsx` head

## Out of scope

- No service worker / offline caching
- No backend persistence (localStorage only) — can wire Lovable Cloud later if you want real check-in history
- No auth — single demo profile

Confirm and I'll build it.
