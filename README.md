# Plateful

AI-powered, photo-based calorie & macro tracker built with Expo (React Native + TypeScript).

Snap a photo of your meal → get instant calorie/macro estimates → fine-tune
individual ingredients if anything's off. Barcode scanning, custom meal
reuse, weight tracking, and a subscription flow with a real free trial and
one-tap cancellation are all built in.

## Tech stack

- Expo (managed workflow) + TypeScript
- React Navigation (native-stack + bottom-tabs)
- Zustand for state
- Supabase for auth/database/storage (schema included, not yet wired to the UI — see below)
- RevenueCat for subscriptions (scaffolded, needs your API keys)
- Open Food Facts for barcode/packaged food lookups (no key required)
- `services/foodRecognition.ts` — abstracted AI vision layer, currently mocked

## 1. Install dependencies

```bash
npm install
```

## 2. Run it in Expo Go

```bash
npx expo start
```

Scan the QR code with the Expo Go app (iOS: use the Camera app; Android:
use the Expo Go app's built-in scanner). Your phone and computer need to be
on the same Wi-Fi network.

The app works end-to-end right now with **mock data** — no API keys
required to try the full flow:

1. Complete onboarding (goal, stats, activity level) → see your calculated
   calorie/macro targets.
2. From the dashboard, tap **"Log a meal"** → take or choose a photo → the
   mock AI recognizer returns a realistic multi-item plate after ~1.5s.
3. Tap any individual food item to adjust its quantity, swap to an
   alternative match, or remove just that item.
4. Save the meal, or save it as a **custom meal** to re-log in one tap
   later from the Meals tab.
5. Try the barcode scanner (real Open Food Facts lookups — works with real
   packaged food barcodes right now).
6. Check Settings → Subscription and Settings → Support / FAQ.

## 3. Wire up real services (when you're ready)

### Supabase

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL Editor to create all tables + RLS policies.
3. Create a **meal-photos** storage bucket with a policy scoping access to each user's own folder (see comment at the bottom of `schema.sql`).
4. Add your project URL and anon key to `app.json` under `expo.extra`:
   ```json
   "extra": {
     "supabaseUrl": "https://your-project.supabase.co",
     "supabaseAnonKey": "your-anon-key"
   }
   ```
   `src/services/supabase.ts` reads from there automatically.
5. The app currently stores everything in local Zustand state (no persistence between sessions). Wiring Supabase means: (a) add auth screens/flow, (b) replace the mock local writes in `useMealStore` / `useWeightStore` / `useUserStore` with Supabase reads/writes. I can build this next if you'd like.

### RevenueCat

1. Create a project at revenuecat.com, add your iOS/Android apps, and configure your products (a monthly and annual subscription, matching `PaywallScreen.tsx`'s `PLAN_OPTIONS`) with a `premium` entitlement.
2. Drop your public SDK keys into `src/services/revenuecat.ts` (`REVENUECAT_API_KEYS`).
3. Configure the free trial length in App Store Connect / Play Console — the trial length shown in the paywall UI is currently hardcoded (7 days annual / 3 days monthly) and should match what you configure there.

### AI food recognition

`src/services/foodRecognition.ts` currently returns realistic mock data after
a simulated delay. To go live:

1. Pick a vision-capable LLM API (or a dedicated food-recognition API).
2. Implement a new provider function matching the `FoodRecognitionProvider`
   type in that file (an example stub is included in a comment at the
   bottom).
3. Point `ACTIVE_PROVIDER` at your new function.
   No other file needs to change — screens only ever call `recognizeFood()`.

## Project structure

```
App.tsx
src/
  screens/
    onboarding/     Welcome, Goals, Stats, ActivityLevel, Summary
    home/           Dashboard (progress rings, macros, today's meals)
    logging/        CameraCapture, ScanResults, FoodItemEdit, BarcodeScanner
    meals/          CustomMeals (list), SaveMeal
    weight/         WeightTracking (log + trend chart)
    settings/       Settings, Subscription, Support, FAQ
    paywall/        Paywall (trial terms shown before purchase)
  components/       Button, Card, ProgressRing, MacroBar, FoodItemCard
  services/         foodRecognition, openFoodFacts, supabase, revenuecat, nutritionCalculator
  store/            useUserStore, useMealStore, useWeightStore, useOnboardingStore
  navigation/       RootNavigator, OnboardingNavigator, MainTabNavigator, types
  theme/            theme.ts (colors, typography, spacing — warm coral + cream palette)
  types/            shared TypeScript types
supabase/
  schema.sql        full table + RLS policy definitions
```

## Design notes

The palette lives in `src/theme/theme.ts` — warm cream backgrounds
(`#FBF3EA`), a warm coral accent (`#F0664D`), and muted macro colors
(terracotta/mustard/sage instead of neon). Change `colors.accent` and its
variants there to retheme the whole app in one place.

## What's addressed from real user complaints

| Complaint                            | Where it's fixed                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No free trial / unclear cancellation | `PaywallScreen.tsx` shows exact trial length + post-trial price before purchase; `SubscriptionScreen.tsx` has a one-tap deep link to native subscription management |
| No in-app support                    | `SupportScreen.tsx` (mailto) + `FAQScreen.tsx`, both reachable from Settings                                                                                        |
| No barcode scanner                   | `BarcodeScannerScreen.tsx`, using Open Food Facts                                                                                                                   |
| Can only edit whole-meal totals      | `FoodItemEditScreen.tsx` — every detected item is individually editable/removable via `FoodItemCard.tsx`                                                            |
| No custom/reusable meals             | `SaveMealScreen.tsx` + `CustomMealsScreen.tsx`                                                                                                                      |
| Inaccurate branded product data      | Corrections are flagged `userCorrected: true` and persisted on the item, so they stick                                                                              |

## Known gaps / next steps

- No auth flow yet (Supabase client is initialized but nothing calls `supabase.auth`) — all data is local-only and resets on app reload.
- Streak tracking is a placeholder (`calculateStreak` in `DashboardScreen.tsx`) — needs real consecutive-day logic once meals persist across sessions.
- No image upload to Supabase Storage yet — photo URIs stay local.
- RevenueCat trial length in the paywall UI is hardcoded and should be kept in sync with your actual App Store Connect / Play Console configuration.
