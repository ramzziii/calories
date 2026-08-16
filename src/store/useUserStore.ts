import { create } from "zustand";
import { DailyTargets, UserProfile } from "@/types";
import { calculateDailyTargets } from "@/services/nutritionCalculator";
import { getUserRepository } from "@/data/repositoryProvider";

interface UserState {
  profile: UserProfile | null;
  targets: DailyTargets | null;
  isHydrated: boolean;
  hydrationError: string | null;

  hydrate: () => Promise<void>;
  setProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  reset: () => Promise<void>;
}

function deriveTargets(profile: UserProfile | null): DailyTargets | null {
  if (!profile) return null;
  return calculateDailyTargets({
    sex: profile.sex,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: profile.age,
    activityLevel: profile.activityLevel,
    goal: profile.goal,
  });
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  targets: null,
  isHydrated: false,
  hydrationError: null,

  hydrate: async () => {
    try {
      const profile = await getUserRepository().getProfile();
      set({
        profile,
        targets: deriveTargets(profile),
        isHydrated: true,
        hydrationError: null,
      });
    } catch (err) {
      set({
        isHydrated: true,
        hydrationError:
          err instanceof Error ? err.message : "Failed to load your profile.",
      });
    }
  },

  setProfile: async (profile) => {
    // Optimistic update — the UI reflects the change immediately; if the
    // write fails we roll back and surface the error rather than leaving
    // the UI showing state that was never actually persisted.
    const previous = get().profile;
    set({ profile, targets: deriveTargets(profile) });
    try {
      await getUserRepository().saveProfile(profile);
    } catch (err) {
      set({ profile: previous, targets: deriveTargets(previous) });
      throw err;
    }
  },

  updateProfile: async (patch) => {
    const current = get().profile;
    if (!current) return;
    const previous = current;
    const updated = { ...current, ...patch };
    set({ profile: updated, targets: deriveTargets(updated) });
    try {
      await getUserRepository().saveProfile(updated);
    } catch (err) {
      set({ profile: previous, targets: deriveTargets(previous) });
      throw err;
    }
  },

  reset: async () => {
    set({ profile: null, targets: null });
    await getUserRepository().clearProfile();
  },
}));
