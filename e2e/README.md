# E2E flows (Maestro)

Run with:

```bash
npm run e2e
```

This requires the [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro)
installed locally and a simulator/emulator running a debug build of the
app with bundle/package id `com.yourcompany.plateful` (see `app.json`).

**These flows were authored but not executed** — the Maestro CLI isn't
available in the environment this repo was set up in, so treat them as a
first draft to run and adjust locally, not as verified-passing tests.

## Flows

- `onboarding.yaml` — full onboarding: Welcome → Goals → Stats →
  ActivityLevel → Summary → lands on the Dashboard.
- `photo-log-edit-save.yaml` — photo-log → edit-ingredient → save. Assumes
  onboarding has already completed (run `onboarding.yaml` first, or start
  from device state that already has a saved profile). Uses "Choose from
  library" instead of the camera shutter, since simulators have no camera
  hardware — this needs at least one photo already in the simulator's
  photo library (`xcrun simctl addmedia booted <path>` on iOS, or push a
  file into the Android emulator's DCIM folder, as a one-time setup step).
  The food-recognition step is backed by a mock provider
  (`src/services/foodRecognition.ts`) that returns one of three random
  meals, so the flow matches the detected item by regex across all known
  mock item names rather than asserting a specific one.

## Known fragility

- The system photo picker step in `photo-log-edit-save.yaml` taps a fixed
  screen coordinate (no stable accessibility id is exposed by the native
  picker) — this is the most likely thing to need adjusting per
  OS/simulator version.
- A few interactive elements (`quantity-input`, `save-changes-button`,
  `log-meal-button`) got `testID`s added specifically so these flows have
  something stable to select on. If you add more Maestro flows, prefer
  adding a `testID` over relying on visible copy, which changes more
  often.
