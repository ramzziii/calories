import { getMealRepository } from "@/data/repositoryProvider";
import { sumFoodItems } from "@/domain/mealMath";
import { useMealStore } from "@/store/useMealStore";
import { CustomMeal, FoodItem, LoggedMeal } from "@/types";

jest.mock("@/data/repositoryProvider", () => ({
  getMealRepository: jest.fn(),
}));

const mockedGetMealRepository = getMealRepository as jest.Mock;

function makeFoodItem(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: "item_1",
    name: "Chicken breast",
    quantity: 100,
    unit: "g",
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    source: "manual",
    ...overrides,
  };
}

function makeLoggedMeal(overrides: Partial<LoggedMeal> = {}): LoggedMeal {
  const items = overrides.items ?? [makeFoodItem()];
  return {
    id: "meal_1",
    userId: "local",
    loggedAt: "2026-01-01T12:00:00.000Z",
    mealType: "lunch",
    items,
    ...sumFoodItems(items),
    ...overrides,
  };
}

function makeCustomMeal(overrides: Partial<CustomMeal> = {}): CustomMeal {
  return {
    id: "custom_1",
    userId: "local",
    name: "My go-to lunch",
    items: [makeFoodItem()],
    createdAt: "2026-01-01T00:00:00.000Z",
    timesUsed: 0,
    ...overrides,
  };
}

describe("useMealStore", () => {
  let repo: {
    getLoggedMeals: jest.Mock;
    addLoggedMeal: jest.Mock;
    updateLoggedMealItems: jest.Mock;
    removeLoggedMeal: jest.Mock;
    getCustomMeals: jest.Mock;
    saveCustomMeal: jest.Mock;
    removeCustomMeal: jest.Mock;
    incrementCustomMealUsage: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      getLoggedMeals: jest.fn().mockResolvedValue([]),
      addLoggedMeal: jest.fn().mockResolvedValue(undefined),
      updateLoggedMealItems: jest.fn().mockResolvedValue(undefined),
      removeLoggedMeal: jest.fn().mockResolvedValue(undefined),
      getCustomMeals: jest.fn().mockResolvedValue([]),
      saveCustomMeal: jest.fn().mockResolvedValue(undefined),
      removeCustomMeal: jest.fn().mockResolvedValue(undefined),
      incrementCustomMealUsage: jest.fn().mockResolvedValue(undefined),
    };
    mockedGetMealRepository.mockReturnValue(repo);
    useMealStore.setState({
      loggedMeals: [],
      customMeals: [],
      isHydrated: false,
      hydrationError: null,
    });
  });

  describe("addLoggedMeal", () => {
    it("adds the meal optimistically and keeps it after a successful save", async () => {
      const meal = makeLoggedMeal();
      await useMealStore.getState().addLoggedMeal(meal);
      expect(useMealStore.getState().loggedMeals).toEqual([meal]);
    });

    it("rolls back the addition when the save rejects", async () => {
      const existing = makeLoggedMeal({ id: "meal_existing" });
      useMealStore.setState({ loggedMeals: [existing] });
      repo.addLoggedMeal.mockRejectedValue(new Error("offline"));

      const meal = makeLoggedMeal({ id: "meal_new" });
      await expect(useMealStore.getState().addLoggedMeal(meal)).rejects.toThrow(
        "offline"
      );

      expect(useMealStore.getState().loggedMeals).toEqual([existing]);
    });
  });

  describe("removeLoggedMeal", () => {
    it("removes the meal optimistically and keeps it removed after success", async () => {
      const meal = makeLoggedMeal();
      useMealStore.setState({ loggedMeals: [meal] });

      await useMealStore.getState().removeLoggedMeal(meal.id);

      expect(useMealStore.getState().loggedMeals).toEqual([]);
    });

    it("rolls back the removal when the save rejects", async () => {
      const meal = makeLoggedMeal();
      useMealStore.setState({ loggedMeals: [meal] });
      repo.removeLoggedMeal.mockRejectedValue(new Error("offline"));

      await expect(useMealStore.getState().removeLoggedMeal(meal.id)).rejects.toThrow(
        "offline"
      );

      expect(useMealStore.getState().loggedMeals).toEqual([meal]);
    });
  });

  describe("addFoodItem", () => {
    it("is a no-op when the meal does not exist", async () => {
      await useMealStore.getState().addFoodItem("missing_meal", makeFoodItem());
      expect(repo.updateLoggedMealItems).not.toHaveBeenCalled();
    });

    it("appends the item and recomputes totals on success", async () => {
      const existing = makeFoodItem({ id: "item_1", calories: 100 });
      const meal = makeLoggedMeal({ items: [existing] });
      useMealStore.setState({ loggedMeals: [meal] });

      const newItem = makeFoodItem({ id: "item_2", calories: 200 });
      await useMealStore.getState().addFoodItem("meal_1", newItem);

      const [updated] = useMealStore.getState().loggedMeals;
      expect(updated.items.map((i: FoodItem) => i.id)).toEqual(["item_1", "item_2"]);
      expect(updated.totalCalories).toBe(300);
    });

    it("rolls back the addition when the save rejects", async () => {
      const meal = makeLoggedMeal();
      useMealStore.setState({ loggedMeals: [meal] });
      repo.updateLoggedMealItems.mockRejectedValue(new Error("offline"));

      await expect(
        useMealStore.getState().addFoodItem("meal_1", makeFoodItem({ id: "item_2" }))
      ).rejects.toThrow("offline");

      expect(useMealStore.getState().loggedMeals).toEqual([meal]);
    });
  });

  describe("updateFoodItem", () => {
    it("is a no-op when the meal does not exist", async () => {
      await useMealStore.getState().updateFoodItem("missing_meal", "item_1", {
        quantity: 200,
      });
      expect(repo.updateLoggedMealItems).not.toHaveBeenCalled();
    });

    it("updates the item, recomputes totals, and marks it userCorrected on success", async () => {
      const meal = makeLoggedMeal();
      useMealStore.setState({ loggedMeals: [meal] });

      await useMealStore.getState().updateFoodItem("meal_1", "item_1", {
        calories: 300,
      });

      const [updated] = useMealStore.getState().loggedMeals;
      expect(updated.items[0].calories).toBe(300);
      expect(updated.items[0].userCorrected).toBe(true);
      expect(updated.totalCalories).toBe(300);
    });

    it("rolls back the entire meal list when the save rejects", async () => {
      const meal = makeLoggedMeal();
      useMealStore.setState({ loggedMeals: [meal] });
      repo.updateLoggedMealItems.mockRejectedValue(new Error("offline"));

      await expect(
        useMealStore.getState().updateFoodItem("meal_1", "item_1", { calories: 300 })
      ).rejects.toThrow("offline");

      expect(useMealStore.getState().loggedMeals).toEqual([meal]);
    });
  });

  describe("removeFoodItem", () => {
    it("removes the item and recomputes totals on success", async () => {
      const items = [
        makeFoodItem({ id: "item_1", calories: 100 }),
        makeFoodItem({ id: "item_2", calories: 200 }),
      ];
      const meal = makeLoggedMeal({ items });
      useMealStore.setState({ loggedMeals: [meal] });

      await useMealStore.getState().removeFoodItem("meal_1", "item_1");

      const [updated] = useMealStore.getState().loggedMeals;
      expect(updated.items.map((i: FoodItem) => i.id)).toEqual(["item_2"]);
      expect(updated.totalCalories).toBe(200);
    });

    it("rolls back when the save rejects", async () => {
      const items = [
        makeFoodItem({ id: "item_1", calories: 100 }),
        makeFoodItem({ id: "item_2", calories: 200 }),
      ];
      const meal = makeLoggedMeal({ items });
      useMealStore.setState({ loggedMeals: [meal] });
      repo.updateLoggedMealItems.mockRejectedValue(new Error("offline"));

      await expect(
        useMealStore.getState().removeFoodItem("meal_1", "item_1")
      ).rejects.toThrow("offline");

      expect(useMealStore.getState().loggedMeals).toEqual([meal]);
    });
  });

  describe("saveAsCustomMeal", () => {
    it("adds a new custom meal optimistically on success", async () => {
      const items = [makeFoodItem()];
      await useMealStore.getState().saveAsCustomMeal("Lunch combo", items);

      const [saved] = useMealStore.getState().customMeals;
      expect(saved.name).toBe("Lunch combo");
      expect(saved.items).toEqual(items);
      expect(saved.timesUsed).toBe(0);
    });

    it("rolls back when the save rejects", async () => {
      const existing = makeCustomMeal({ id: "existing" });
      useMealStore.setState({ customMeals: [existing] });
      repo.saveCustomMeal.mockRejectedValue(new Error("offline"));

      await expect(
        useMealStore.getState().saveAsCustomMeal("Lunch combo", [makeFoodItem()])
      ).rejects.toThrow("offline");

      expect(useMealStore.getState().customMeals).toEqual([existing]);
    });
  });

  describe("removeCustomMeal", () => {
    it("removes the custom meal optimistically on success", async () => {
      const meal = makeCustomMeal();
      useMealStore.setState({ customMeals: [meal] });

      await useMealStore.getState().removeCustomMeal(meal.id);

      expect(useMealStore.getState().customMeals).toEqual([]);
    });

    it("rolls back when the save rejects", async () => {
      const meal = makeCustomMeal();
      useMealStore.setState({ customMeals: [meal] });
      repo.removeCustomMeal.mockRejectedValue(new Error("offline"));

      await expect(useMealStore.getState().removeCustomMeal(meal.id)).rejects.toThrow(
        "offline"
      );

      expect(useMealStore.getState().customMeals).toEqual([meal]);
    });
  });

  describe("logCustomMeal", () => {
    it("returns null when the custom meal does not exist", async () => {
      const result = await useMealStore.getState().logCustomMeal("missing");
      expect(result).toBeNull();
      expect(repo.addLoggedMeal).not.toHaveBeenCalled();
    });

    it("logs the meal and increments usage on success", async () => {
      const customMeal = makeCustomMeal({ timesUsed: 1 });
      useMealStore.setState({ customMeals: [customMeal] });

      const result = await useMealStore.getState().logCustomMeal(customMeal.id);

      expect(result).not.toBeNull();
      expect(useMealStore.getState().loggedMeals).toHaveLength(1);
      expect(useMealStore.getState().customMeals[0].timesUsed).toBe(2);
    });

    it("rolls back the whole operation when adding the logged meal fails", async () => {
      const customMeal = makeCustomMeal({ timesUsed: 1 });
      useMealStore.setState({ customMeals: [customMeal] });
      repo.addLoggedMeal.mockRejectedValue(new Error("offline"));

      await expect(useMealStore.getState().logCustomMeal(customMeal.id)).rejects.toThrow(
        "offline"
      );

      expect(useMealStore.getState().loggedMeals).toEqual([]);
      expect(useMealStore.getState().customMeals[0].timesUsed).toBe(1);
      expect(repo.incrementCustomMealUsage).not.toHaveBeenCalled();
    });

    it("keeps the logged meal but rolls back only the usage count when incrementing usage fails", async () => {
      const customMeal = makeCustomMeal({ timesUsed: 1 });
      useMealStore.setState({ customMeals: [customMeal] });
      repo.incrementCustomMealUsage.mockRejectedValue(new Error("offline"));

      await expect(useMealStore.getState().logCustomMeal(customMeal.id)).rejects.toThrow(
        "offline"
      );

      // The logged meal itself was already committed via addLoggedMeal
      // (a separate try/catch) before the usage-increment failure, so it
      // is NOT rolled back — only the optimistic timesUsed bump is.
      expect(useMealStore.getState().loggedMeals).toHaveLength(1);
      expect(useMealStore.getState().customMeals[0].timesUsed).toBe(1);
    });
  });

  describe("mealsForDate", () => {
    it("returns only meals logged on the given ISO date", () => {
      const mealOnDate = makeLoggedMeal({
        id: "meal_on",
        loggedAt: "2026-01-01T09:00:00.000Z",
      });
      const mealOffDate = makeLoggedMeal({
        id: "meal_off",
        loggedAt: "2026-01-02T09:00:00.000Z",
      });
      useMealStore.setState({ loggedMeals: [mealOnDate, mealOffDate] });

      const result = useMealStore.getState().mealsForDate("2026-01-01");

      expect(result.map((m) => m.id)).toEqual(["meal_on"]);
    });
  });
});
