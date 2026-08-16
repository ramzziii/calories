import { create } from "zustand";
import { getLocales } from "expo-localization";
import { UnitSystem } from "@/domain/unitConversion";
import { readJson, STORAGE_KEYS, writeJson } from "@/data/repositories/local/storage";

function detectDefaultSystem(): UnitSystem {
  const region = getLocales()[0]?.regionCode;
  return region === "US" ? "imperial" : "metric";
}

interface UnitsState {
  system: UnitSystem;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  setSystem: (system: UnitSystem) => Promise<void>;
}

export const useUnitsStore = create<UnitsState>((set) => ({
  // Locale-based guess, correct from the very first render — hydrate()
  // below only overrides it if the user has explicitly chosen otherwise
  // in Settings.
  system: detectDefaultSystem(),
  isHydrated: false,

  hydrate: async () => {
    try {
      const stored = await readJson<UnitSystem | null>(STORAGE_KEYS.unitSystem, null);
      if (stored) {
        set({ system: stored, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  setSystem: async (system) => {
    set({ system });
    try {
      await writeJson(STORAGE_KEYS.unitSystem, system);
    } catch {
      // Non-critical — the preference just won't persist across restarts.
    }
  },
}));
