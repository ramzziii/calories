import { create } from "zustand";
import { WeightEntry } from "@/types";
import { getWeightRepository } from "@/data/repositoryProvider";

interface WeightState {
  entries: WeightEntry[];
  isHydrated: boolean;
  hydrationError: string | null;

  hydrate: () => Promise<void>;
  addEntry: (weightKg: number) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
}

export const useWeightStore = create<WeightState>((set, get) => ({
  entries: [],
  isHydrated: false,
  hydrationError: null,

  hydrate: async () => {
    try {
      const entries = await getWeightRepository().getEntries();
      set({ entries, isHydrated: true, hydrationError: null });
    } catch (err) {
      set({
        isHydrated: true,
        hydrationError:
          err instanceof Error ? err.message : "Failed to load your weight history.",
      });
    }
  },

  addEntry: async (weightKg) => {
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      throw new Error("Weight must be a positive number.");
    }

    const previous = get().entries;
    const entry: WeightEntry = {
      id: `weight_${Date.now()}`,
      userId: "local",
      loggedAt: new Date().toISOString(),
      weightKg,
    };
    const next = [...previous, entry].sort((a, b) =>
      a.loggedAt.localeCompare(b.loggedAt)
    );
    set({ entries: next });

    try {
      await getWeightRepository().addEntry(entry);
    } catch (err) {
      set({ entries: previous });
      throw err;
    }
  },

  removeEntry: async (id) => {
    const previous = get().entries;
    set({ entries: previous.filter((e) => e.id !== id) });
    try {
      await getWeightRepository().removeEntry(id);
    } catch (err) {
      set({ entries: previous });
      throw err;
    }
  },
}));
