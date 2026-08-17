# Auth + billing setup

Google/Apple sign-in, the 7-day trial, and the $2.99/$9.99/$99.99 subscription
tiers are fully built and deployed against your live Supabase project
(`ojitycyhnrlguyvacxqp`). What's below is the remaining setup that only you
can do — dashboard accounts and credentials this environment has no access
to.

## Already done (nothing to do here)

- `accounts` / `subscriptions` / `usage_log` tables + RLS — migrated and
  live (`supabase/migrations/20260816170000_auth_billing.sql`)
- `analyze-meal` now requires a real signed-in user and enforces 15/day
  (trial) or 40/day (paid), atomically, server-side — **this closed the
  actual security hole**: previously the public anon key alone (baked into
  every app install) was enough to call the paid OpenAI endpoint for free,
  unlimited. Verified live: a request with only the anon key now gets
  `401 AUTH_REQUIRED` instead of an OpenAI response.
- `revenuecat-webhook` function deployed, waiting on step 5 below
- Google/Apple sign-in via Supabase's browser-redirect OAuth
  (`src/services/auth.ts`) — deliberately not using native SDKs, so this
  works in Expo Go once steps 1–3 are done, no dev build required
- Session storage moved from AsyncStorage to the Keychain/Keystore via
  expo-secure-store
- Paywall (weekly $2.99 / monthly $9.99 / yearly $99.99), trial countdown,
  daily-limit and trial-expired screens

## 1. Google sign-in

1. [console.cloud.google.com](https://console.cloud.google.com) → create or
   pick a project → APIs & Services → OAuth consent screen → configure
   (External, add your support email)
2. Credentials → Create Credentials → OAuth client ID → **Web application**
3. Authorized redirect URI:
   `https://ojitycyhnrlguyvacxqp.supabase.co/auth/v1/callback`
4. Copy the Client ID + Client Secret
5. Supabase Dashboard → Authentication → Providers → **Google** → enable,
   paste Client ID/Secret → Save

## 2. Apple sign-in

Requires the Apple Developer Program ($99/year) —
[developer.apple.com/programs](https://developer.apple.com/programs).

1. Certificates, Identifiers & Profiles → Identifiers → your App ID →
   enable the "Sign In with Apple" capability
2. Identifiers → Services IDs → create one (this is the "Client ID" Supabase
   needs) → configure it with the same redirect URI as above:
   `https://ojitycyhnrlguyvacxqp.supabase.co/auth/v1/callback`
3. Keys → create a key with "Sign In with Apple" enabled → download the
   `.p8` file (only downloadable once — save it somewhere safe)
4. Supabase Dashboard → Authentication → Providers → **Apple** → enable,
   fill in the Services ID, Team ID, Key ID, and the private key contents
   from the `.p8` file

## 3. Redirect URL allowlist

Supabase Dashboard → Authentication → URL Configuration → Redirect URLs →
add `yumtrack://auth-callback`.

If testing in Expo Go before you have a dev build, also add the `exp://`
URL your terminal prints when you run `npx expo start` (something like
`exp://192.168.x.x:8081/--/auth-callback`) — note this changes with your
dev machine's IP, so it's easier to just test OAuth from a dev build once
you have one (see step 6).

## 4. RevenueCat + store subscription products

1. Create an account at [app.revenuecat.com](https://app.revenuecat.com),
   add your app for iOS and Android
2. **App Store Connect**: create 3 auto-renewable subscription products in
   one subscription group — weekly $2.99, monthly $9.99, yearly $99.99.
   Requires an active paid Apple Developer Program agreement.
3. **Google Play Console**: create the matching 3 subscription products
4. In RevenueCat: connect both stores, then create an Offering using the
   default package types — `$rc_weekly` / `$rc_monthly` / `$rc_annual` —
   mapped to the products above. These identifiers already match what
   `src/screens/paywall/PaywallScreen.tsx` expects; if you name your
   RevenueCat packages differently, update the `PLAN_OPTIONS` ids there to
   match.
5. RevenueCat → Project Settings → API Keys → copy the iOS and Android
   **public** SDK keys → paste into `REVENUECAT_API_KEYS` in
   `src/services/revenuecat.ts`

## 5. RevenueCat → Supabase webhook

Keeps the `subscriptions` table (what `analyze-meal` actually checks) in
sync with real purchases/renewals/cancellations:

```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET=<any random string you generate>
```

Then in RevenueCat: Project Settings → Integrations → Webhooks → add URL
`https://ojitycyhnrlguyvacxqp.supabase.co/functions/v1/revenuecat-webhook`,
Authorization header value `Bearer <the same random string>`.

## 6. Dev build (needed for real purchase testing)

Google/Apple sign-in works in Expo Go once steps 1–3 are done. RevenueCat
purchases do not — that needs a real dev build:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## What was and wasn't verified in this environment

- **Verified live** against your real Supabase project: the new
  schema/RLS, and that `analyze-meal` now rejects anon-key-only requests
  (`401 AUTH_REQUIRED`) instead of silently proceeding — the actual
  vulnerability this work closes.
- **Verified with 20 unit tests** (`src/domain/usageLimits.test.ts`): every
  trial/cap/paid-status edge case, including the "canceled but still
  within the paid period" case.
- **Not verified live**: an authenticated user actually exhausting their
  daily cap and getting `429 DAILY_LIMIT_REACHED`. That needs a real
  signed-in session, which needs steps 1–2 above — this environment has no
  Google/Apple OAuth credentials to complete a real sign-in, no
  service-role/dashboard access to fabricate a test user directly (tried
  Supabase's built-in anonymous sign-in as a workaround; it's disabled by
  default on your project), and no CI-linked dev build to test purchases.
  The enforcement logic is a single atomic SQL statement
  (`increment_usage_if_under_cap` in the migration) reviewed carefully, but
  a real pass after step 1/2 is worth doing before this ships broadly.
- **Not verified at all**: native Apple/Google button polish, real
  purchases, refund/proration behavior on the App Store/Play Store side —
  these need your dev accounts and a physical device, nothing here can
  substitute for that.
