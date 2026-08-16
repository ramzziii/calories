import { create } from "zustand";
import { OnboardingDraft } from "@/navigation/types";

interface OnboardingState {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  draft: {},
  update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
  reset: () => set({ draft: {} }),
}));
