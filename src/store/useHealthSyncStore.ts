import { create } from "zustand";
import { readJson, STORAGE_KEYS, writeJson } from "@/data/repositories/local/storage";
import {
  isHealthSyncSupported,
  requestHealthSyncPermission,
} from "@/services/healthSync";

interface HealthSyncState {
  enabled: boolean;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  // Returns whether sync actually ended up enabled (permission may be
  // denied, or unavailable entirely in Expo Go) — the caller should
  // reflect this back rather than assuming the toggle succeeded.
  setEnabled: (enabled: boolean) => Promise<boolean>;
}

export const useHealthSyncStore = create<HealthSyncState>((set) => ({
  enabled: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const stored = await readJson<boolean>(STORAGE_KEYS.healthSyncEnabled, false);
      // Re-validate on every launch — permission could have been revoked
      // in the OS settings since we last checked, or this could be a
      // fresh Expo Go session where it was never available at all.
      set({
        enabled: stored && isHealthSyncSupported(),
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  setEnabled: async (enabled) => {
    if (!enabled) {
      set({ enabled: false });
      try {
        await writeJson(STORAGE_KEYS.healthSyncEnabled, false);
      } catch {
        // Non-critical.
      }
      return false;
    }

    const granted = await requestHealthSyncPermission();
    set({ enabled: granted });
    try {
      await writeJson(STORAGE_KEYS.healthSyncEnabled, granted);
    } catch {
      // Non-critical — the preference just won't persist across restarts.
    }
    return granted;
  },
}));
