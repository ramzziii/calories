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
- `revenuecat-webhook` function deployed, and its secret is already set —
  see step 7 below, just needs RevenueCat's UI configured to use it
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

## 2. Apple sign-in — SKIPPED FOR NOW

You're holding off on this since it needs the paid Apple Developer Program
($99/year). That's fine to defer — nothing else in this doc depends on it.
The "Continue with Apple" button already only renders on iOS
(`src/screens/auth/SignInScreen.tsx`), so nothing shows or breaks on
Android in the meantime. When you're ready for it later, come back to this
section:

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

This step is required, not optional — skipping it is exactly what causes
"Safari can't open the page because it couldn't connect to the server"
after picking your Google account: Supabase can't find your redirect URL
in its allowlist, so it falls back to the default Site URL
(`http://localhost:3000`), which your phone obviously can't reach.

Supabase Dashboard → Authentication → URL Configuration → Redirect URLs →
add **both** of these:

- `yumtrack://auth-callback` — for when you have a dev build later
- `exp://**` — a wildcard covering Expo Go's URL, which embeds your
  computer's local IP and port (`exp://192.168.x.x:8081/--/auth-callback`)
  and changes every time you're on a different network, so a single exact
  URL isn't practical to keep updating

Save, then fully close and reopen the app (Expo Go caches some of this)
before testing sign-in again.

## 4. Google Play Console — create the app + subscription

This is the store side: it's where the $2.99/$9.99/$99.99 products
actually get defined and sold. Android bundles all three into **one**
subscription with three "base plans" (not three separate subscriptions
the way Apple does it) — that's just how Play Console models it; nothing
in the app's code needs to change either way, since RevenueCat abstracts
this difference away for us.

1. **Developer account** (skip if you already have one): go to
   [play.google.com/console/signup](https://play.google.com/console/signup),
   pay the one-time $25 registration fee, fill in your developer details.
2. **Create the app**: Play Console → All apps → Create app.
   - App name: `YumTrack`
   - Default language: English (or your choice)
   - App or game: **App**
   - Free or paid: **Free** (subscriptions are sold as in-app products, not
     as a paid app download)
   - Accept the declarations → Create app
3. Play Console will show a setup checklist (Dashboard → "Set up your
   app"). You don't need to finish all of it before creating subscription
   products, but you **will** need these done before you can publish to
   even an internal testing track: app icon, short/full description,
   screenshots, a privacy policy URL (any URL works for now, even a
   placeholder page — swap it for a real one before public launch),
   content rating questionnaire, target audience, and the Data Safety
   form (declare what data YumTrack collects — camera photos, email from
   sign-in, etc.).
4. **Create the subscription**: left sidebar → Monetize → Products →
   Subscriptions → **Create subscription**.
   - Product ID: `premium` (type this exactly — code elsewhere in this
     doc doesn't hardcode it, but keep it simple)
   - Name: "YumTrack Premium"
5. Inside that subscription, **Add base plan** three times:
   - Base plan ID `weekly`, billing period **Weekly**, price **$2.99**
   - Base plan ID `monthly`, billing period **Monthly**, price **$9.99**
   - Base plan ID `yearly`, billing period **Yearly**, price **$99.99**
   - Set each base plan's status to **Active** (a base plan you don't
     activate won't be purchasable, even after the whole product is
     active)
6. You'll need at least one build of the app uploaded to Play Console
   (even just to Internal Testing track) before subscriptions can
   actually be test-purchased — see section 8 below (Dev build).

## 5. Connect Play Console to RevenueCat

RevenueCat needs read access to your Play Console financial data so it
can verify purchases. This is the fiddliest part — go slow:

1. **Google Cloud service account**: Play Console → Setup → API access.
   This screen will prompt you to either link an existing Google Cloud
   project or create one — let it create one for you.
2. On that same API access page, under "Service accounts," click **Create
   new service account** — it deep-links you into Google Cloud Console
   with the right project pre-selected.
3. In Google Cloud Console: Create service account → give it any name
   (e.g. "revenuecat") → Create and continue → skip granting it a
   project-level role (leave default) → Done.
4. Back on that service account's page in Google Cloud Console: **Keys**
   tab → Add key → Create new key → **JSON** → this downloads a `.json`
   file. Keep it — you'll upload it to RevenueCat in step 8.
5. Back in Play Console's API access page, find your new service account
   in the list → **Grant access**.
6. Set its permissions: under "Account permissions," grant **View
   financial data** (required) — Finance → "View financial data, orders,
   and cancellation survey responses" is enough for RevenueCat.
7. Create your RevenueCat account at
   [app.revenuecat.com](https://app.revenuecat.com) → create a Project
   (e.g. "YumTrack") → Add app → platform **Google Play**.
8. RevenueCat will ask for: your app's package name (`com.yourcompany.yumtrack`
   from `app.json`, unless you've since changed it) and the service
   account JSON file from step 4 — upload it.

## 6. RevenueCat — products, entitlement, offering

1. RevenueCat → your project → **Products** → it should detect the 3 base
   plans from Play Console automatically once step 5 is connected (may
   take a few minutes) — if not, add them manually using the same
   product/base-plan IDs from step 4.
2. **Entitlements** → Create entitlement → id `premium` → attach all 3
   products to it. This is the "does this user get premium access" flag
   the app checks.
3. **Offerings** → open the default offering (or create one) → Add
   Package, three times, using RevenueCat's standard package types so
   the identifiers come out as `$rc_weekly`, `$rc_monthly`, `$rc_annual`
   — these already match what `src/screens/paywall/PaywallScreen.tsx`
   expects, so no code change needed if you follow this exactly. Attach
   each package to its matching product from step 1.
4. **Project Settings → API Keys** → copy the **Google Play public app
   API key** (starts with `goog_`). Send it to me (or paste it yourself)
   and I'll wire it into `REVENUECAT_API_KEYS.android` in
   `src/services/revenuecat.ts` — it's a public SDK key, meant to ship
   inside the app, same trust level as the Supabase anon key.

## 7. RevenueCat → Supabase webhook — already done

I generated a random secret and ran
`supabase secrets set REVENUECAT_WEBHOOK_SECRET=...` against your project
already — nothing for you to run. The only thing left is telling
RevenueCat about it:

RevenueCat → Project Settings → Integrations → Webhooks → Add webhook:

- URL: `https://ojitycyhnrlguyvacxqp.supabase.co/functions/v1/revenuecat-webhook`
- Authorization header value: ask me for the secret value when you get to
  this step (I kept it out of this file since it's committed to git) and
  enter it as `Bearer <that value>`

## 8. Dev build (needed for real purchase testing)

Google sign-in works in Expo Go once steps 1 and 3 are done. RevenueCat
purchases do not — Play Billing needs a real dev build, and Play Console
needs a build uploaded to at least Internal Testing before subscriptions
are purchasable at all:

```bash
eas build --profile development --platform android
```

Once installed on a device, add yourself as a license tester in Play
Console (Setup → License testing) so test purchases don't charge a real
card.

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
  signed-in session — this environment has no Google OAuth credentials to
  complete a real sign-in, no service-role/dashboard access to fabricate a
  test user directly (tried Supabase's built-in anonymous sign-in as a
  workaround; it's disabled by default on your project), and no CI-linked
  dev build to test purchases. The enforcement logic is a single atomic
  SQL statement (`increment_usage_if_under_cap` in the migration) reviewed
  carefully, but a real pass once you have a signed-in session is worth
  doing before this ships broadly.
- **Not verified at all**: real Play Store purchases, the RevenueCat
  webhook actually firing and updating `subscriptions`, cancellation
  behavior — these need your Play Console/RevenueCat setup above and a
  physical (or emulator) Android device, nothing here can substitute for
  that.
