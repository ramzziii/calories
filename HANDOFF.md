# Handoff notes — continuing in Claude Code

This project was scaffolded and partially hardened in a Claude.ai chat
session. Picking up here in Claude Code, in priority order:

## 1. Get it running

```bash
npm install
npm run typecheck
npm run lint
```

Expect some lint/format noise on first run since `npm run lint:fix` and
`npm run format` have never been run against this codebase — that's fine,
clean it up as part of settling in.

## 2. Known incomplete/broken bits (fix these first)

- **`src/screens/logging/BarcodeScannerScreen.tsx`** — the catch block
  around `addLoggedMeal` incorrectly falls through to the "Product not
  found" UI state on a _save_ failure (as opposed to a lookup failure).
  Needs its own `saveError` state distinct from `notFound`, with a
  "Try again" that retries the save rather than re-scanning.
- **`App.tsx`** — `useUserStore`, `useMealStore`, `useWeightStore` all
  have a `hydrate()` action (loads persisted state from AsyncStorage via
  the repository layer) but nothing calls it yet. Needs a startup effect
  in `App.tsx` that calls all three, plus a loading screen gated on
  `isHydrated` from each store so the UI doesn't flash empty state before
  hydration completes.
- **No tests exist yet.** Jest, RNTL, and Maestro are configured
  (`jest.config.js`, `package.json` scripts) but there are zero test
  files. Priority order for coverage:
  1. `src/domain/mealMath.ts` — pure functions, highest-value tests,
     start here. Pay particular attention to `scaleFoodItemToQuantity`
     edge cases (zero/negative/NaN quantity).
  2. `src/services/nutritionCalculator.ts` — BMR/TDEE/macro math.
  3. `src/data/repositories/local/*` — test against a fake/mocked
     AsyncStorage (the jest.setup.ts already mocks it via
     `@react-native-async-storage/async-storage/jest/async-storage-mock`).
  4. `src/store/*` — test optimistic-update rollback behavior
     specifically (mock a repository that rejects and assert state
     reverts).
  5. Component tests: `FoodItemCard`, `MacroBar`, `ProgressRing`.
  6. Maestro E2E flows in a new `e2e/flows/` directory: onboarding
     end-to-end, and photo-log → edit-ingredient → save.
- **No error boundary.** A thrown render error anywhere currently
  crashes to a red screen with no recovery. Add one wrapping
  `RootNavigator` in `App.tsx`.
- **`package-lock.json` is intentionally not committed** — a lockfile
  generated in the sandbox environment caused an "Invalid Version" npm
  error on a different machine/npm version. Generate your own locally
  with `npm install` and commit it once you've confirmed `npm ci` works
  cleanly in CI.

## 3. Architecture context worth knowing

- **Repository pattern**: `src/data/repositories/` — stores never talk to
  AsyncStorage or Supabase directly, only to the interfaces in
  `types.ts`. `repositoryProvider.ts` is the single switch point; it
  currently wires up the `Local*` implementations. The `Supabase*`
  implementations exist and are written against `supabase/schema.sql`,
  but are inactive pending real auth screens (no sign-in/sign-up UI
  exists yet — `supabase.auth` is called but nothing populates a
  session).
- **`src/domain/`** is for pure, framework-free business logic — no
  React, no AsyncStorage, no Supabase imports allowed in here, by design,
  so it stays trivially unit-testable. `mealMath.ts` is the only file so
  far; the nutrition calculator in `services/` is a good candidate to
  move here too since it's equally pure (it's in `services/` only
  because it was written before this convention existed).
- **Optimistic updates**: all store write actions (`useMealStore`,
  `useUserStore`, `useWeightStore`) update in-memory state immediately,
  then persist, then roll back on failure. This is deliberate — don't
  "simplify" it back to persist-then-update, that reintroduces UI lag on
  every interaction.

## 4. Feature work still pending from the original spec

- Real AI vision provider (currently mocked in
  `services/foodRecognition.ts`)
- Real RevenueCat API keys + trial length sync with App Store
  Connect/Play Console config
- Supabase auth screens + switching `repositoryProvider.ts` to the
  Supabase implementations
- Image upload to Supabase Storage (currently photo URIs stay local-only)
- Real streak-tracking logic in `DashboardScreen.tsx` (currently a
  placeholder that only checks "logged today")

See `README.md` for the full original feature/architecture rundown.
