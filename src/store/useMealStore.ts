import { create } from "zustand";
import { CustomMeal, FoodItem, LoggedMeal } from "@/types";
import { getMealRepository } from "@/data/repositoryProvider";
import { inferMealTypeFromHour, sumFoodItems } from "@/domain/mealMath";

interface MealState {
  loggedMeals: LoggedMeal[];
  customMeals: CustomMeal[];
  isHydrated: boolean;
  hydrationError: string | null;

  hydrate: () => Promise<void>;

  addLoggedMeal: (meal: LoggedMeal) => Promise<void>;
  removeLoggedMeal: (mealId: string) => Promise<void>;

  // Ingredient-level editing — the #1 requested fix from user reviews.
  updateFoodItem: (
    mealId: string,
    itemId: string,
    patch: Partial<FoodItem>
  ) => Promise<void>;
  removeFoodItem: (mealId: string, itemId: string) => Promise<void>;

  saveAsCustomMeal: (name: string, items: FoodItem[]) => Promise<void>;
  removeCustomMeal: (customMealId: string) => Promise<void>;
  logCustomMeal: (customMealId: string) => Promise<LoggedMeal | null>;

  mealsForDate: (isoDate: string) => LoggedMeal[];
}

export const useMealStore = create<MealState>((set, get) => ({
  loggedMeals: [],
  customMeals: [],
  isHydrated: false,
  hydrationError: null,

  hydrate: async () => {
    try {
      const repo = getMealRepository();
      const [loggedMeals, customMeals] = await Promise.all([
        repo.getLoggedMeals(),
        repo.getCustomMeals(),
      ]);
      set({ loggedMeals, customMeals, isHydrated: true, hydrationError: null });
    } catch (err) {
      set({
        isHydrated: true,
        hydrationError: err instanceof Error ? err.message : "Failed to load your meals.",
      });
    }
  },

  addLoggedMeal: async (meal) => {
    const previous = get().loggedMeals;
    set({ loggedMeals: [...previous, meal] });
    try {
      await getMealRepository().addLoggedMeal(meal);
    } catch (err) {
      set({ loggedMeals: previous });
      throw err;
    }
  },

  removeLoggedMeal: async (mealId) => {
    const previous = get().loggedMeals;
    set({ loggedMeals: previous.filter((m) => m.id !== mealId) });
    try {
      await getMealRepository().removeLoggedMeal(mealId);
    } catch (err) {
      set({ loggedMeals: previous });
      throw err;
    }
  },

  updateFoodItem: async (mealId, itemId, patch) => {
    const previous = get().loggedMeals;
    const meal = previous.find((m) => m.id === mealId);
    if (!meal) return;

    const items = meal.items.map((it) =>
      it.id === itemId ? { ...it, ...patch, userCorrected: true } : it
    );
    const updatedMeal = { ...meal, items, ...sumFoodItems(items) };
    set({ loggedMeals: previous.map((m) => (m.id === mealId ? updatedMeal : m)) });

    try {
      await getMealRepository().updateLoggedMealItems(mealId, items);
    } catch (err) {
      set({ loggedMeals: previous });
      throw err;
    }
  },

  removeFoodItem: async (mealId, itemId) => {
    const previous = get().loggedMeals;
    const meal = previous.find((m) => m.id === mealId);
    if (!meal) return;

    const items = meal.items.filter((it) => it.id !== itemId);
    const updatedMeal = { ...meal, items, ...sumFoodItems(items) };
    set({ loggedMeals: previous.map((m) => (m.id === mealId ? updatedMeal : m)) });

    try {
      await getMealRepository().updateLoggedMealItems(mealId, items);
    } catch (err) {
      set({ loggedMeals: previous });
      throw err;
    }
  },

  saveAsCustomMeal: async (name, items) => {
    const previous = get().customMeals;
    const meal: CustomMeal = {
      id: `custom_${Date.now()}`,
      userId: "local",
      name,
      items,
      createdAt: new Date().toISOString(),
      timesUsed: 0,
    };
    set({ customMeals: [...previous, meal] });
    try {
      await getMealRepository().saveCustomMeal(meal);
    } catch (err) {
      set({ customMeals: previous });
      throw err;
    }
  },

  removeCustomMeal: async (customMealId) => {
    const previous = get().customMeals;
    set({ customMeals: previous.filter((m) => m.id !== customMealId) });
    try {
      await getMealRepository().removeCustomMeal(customMealId);
    } catch (err) {
      set({ customMeals: previous });
      throw err;
    }
  },

  logCustomMeal: async (customMealId) => {
    const customMeal = get().customMeals.find((m) => m.id === customMealId);
    if (!customMeal) return null;

    const items = customMeal.items.map((i) => ({
      ...i,
      id: `${i.id}_${Date.now()}`,
      source: "custom_meal" as const,
    }));
    const loggedMeal: LoggedMeal = {
      id: `meal_${Date.now()}`,
      userId: customMeal.userId,
      loggedAt: new Date().toISOString(),
      mealType: inferMealTypeFromHour(new Date().getHours()),
      items,
      ...sumFoodItems(items),
    };

    await get().addLoggedMeal(loggedMeal);

    const previousCustomMeals = get().customMeals;
    set({
      customMeals: previousCustomMeals.map((m) =>
        m.id === customMealId ? { ...m, timesUsed: m.timesUsed + 1 } : m
      ),
    });
    try {
      await getMealRepository().incrementCustomMealUsage(customMealId);
    } catch (err) {
      set({ customMeals: previousCustomMeals });
      throw err;
    }

    return loggedMeal;
  },

  mealsForDate: (isoDate) => {
    return get().loggedMeals.filter((m) => m.loggedAt.startsWith(isoDate));
  },
}));
