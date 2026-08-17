import { create } from "zustand";
import { readJson, STORAGE_KEYS, writeJson } from "@/data/repositories/local/storage";

/**
 * Remembers what the user corrected a recognized food to, keyed by food
 * name, so the next time AI vision recognizes the same food it starts
 * from what the user actually confirmed rather than a fresh first guess.
 *
 * No AI photo recognition is ever perfectly accurate — every competitor
 * has this problem. What none of them do is get better *for this user*
 * over time. This is that: a personalization cache, not a new AI model.
 */
export interface FoodCorrection {
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  correctedAt: string;
}

type CorrectionInput = Omit<FoodCorrection, "correctedAt">;

interface FoodCorrectionsState {
  corrections: Record<string, FoodCorrection>;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  recordCorrection: (foodName: string, correction: CorrectionInput) => Promise<void>;
  getCorrection: (foodName: string) => FoodCorrection | null;
}

function normalizeFoodName(name: string): string {
  return name.trim().toLowerCase();
}

export const useFoodCorrectionsStore = create<FoodCorrectionsState>((set, get) => ({
  corrections: {},
  isHydrated: false,

  hydrate: async () => {
    try {
      const stored = await readJson<Record<string, FoodCorrection>>(
        STORAGE_KEYS.foodCorrections,
        {}
      );
      set({ corrections: stored, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  recordCorrection: async (foodName, correction) => {
    const key = normalizeFoodName(foodName);
    const previous = get().corrections;
    const next: Record<string, FoodCorrection> = {
      ...previous,
      [key]: { ...correction, correctedAt: new Date().toISOString() },
    };
    set({ corrections: next });
    try {
      await writeJson(STORAGE_KEYS.foodCorrections, next);
    } catch {
      // Non-critical — the correction just won't survive an app restart,
      // but it still applies for the rest of this session.
    }
  },

  getCorrection: (foodName) => {
    return get().corrections[normalizeFoodName(foodName)] ?? null;
  },
}));
