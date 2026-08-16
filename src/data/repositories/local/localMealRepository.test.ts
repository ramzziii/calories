import AsyncStorage from "@react-native-async-storage/async-storage";
import { CustomMeal, FoodItem, LoggedMeal } from "@/types";
import { LocalMealRepository } from "@/data/repositories/local/localMealRepository";

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
    totalCalories: 165,
    totalProteinG: 31,
    totalCarbsG: 0,
    totalFatG: 3.6,
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

describe("LocalMealRepository", () => {
  let repo: LocalMealRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    repo = new LocalMealRepository();
  });

  describe("logged meals", () => {
    it("returns an empty array when nothing has been logged", async () => {
      expect(await repo.getLoggedMeals()).toEqual([]);
    });

    it("adds a logged meal", async () => {
      const meal = makeLoggedMeal();
      await repo.addLoggedMeal(meal);
      expect(await repo.getLoggedMeals()).toEqual([meal]);
    });

    it("updates a logged meal's items and recomputes totals", async () => {
      await repo.addLoggedMeal(makeLoggedMeal());
      const newItems = [
        makeFoodItem({ id: "item_2", calories: 200, proteinG: 10, carbsG: 20, fatG: 5 }),
      ];

      await repo.updateLoggedMealItems("meal_1", newItems);

      const [updated] = await repo.getLoggedMeals();
      expect(updated.items).toEqual(newItems);
      expect(updated.totalCalories).toBe(200);
      expect(updated.totalProteinG).toBe(10);
      expect(updated.totalCarbsG).toBe(20);
      expect(updated.totalFatG).toBe(5);
    });

    it("removes a logged meal by id", async () => {
      await repo.addLoggedMeal(makeLoggedMeal({ id: "meal_1" }));
      await repo.addLoggedMeal(makeLoggedMeal({ id: "meal_2" }));

      await repo.removeLoggedMeal("meal_1");

      const meals = await repo.getLoggedMeals();
      expect(meals.map((m) => m.id)).toEqual(["meal_2"]);
    });
  });

  describe("custom meals", () => {
    it("returns an empty array when no custom meals exist", async () => {
      expect(await repo.getCustomMeals()).toEqual([]);
    });

    it("saves a custom meal", async () => {
      const meal = makeCustomMeal();
      await repo.saveCustomMeal(meal);
      expect(await repo.getCustomMeals()).toEqual([meal]);
    });

    it("removes a custom meal by id", async () => {
      await repo.saveCustomMeal(makeCustomMeal({ id: "custom_1" }));
      await repo.saveCustomMeal(makeCustomMeal({ id: "custom_2" }));

      await repo.removeCustomMeal("custom_1");

      const meals = await repo.getCustomMeals();
      expect(meals.map((m) => m.id)).toEqual(["custom_2"]);
    });

    it("increments a custom meal's usage count", async () => {
      await repo.saveCustomMeal(makeCustomMeal({ id: "custom_1", timesUsed: 2 }));

      await repo.incrementCustomMealUsage("custom_1");

      const [meal] = await repo.getCustomMeals();
      expect(meal.timesUsed).toBe(3);
    });

    it("leaves other custom meals' usage counts untouched", async () => {
      await repo.saveCustomMeal(makeCustomMeal({ id: "custom_1", timesUsed: 2 }));
      await repo.saveCustomMeal(makeCustomMeal({ id: "custom_2", timesUsed: 5 }));

      await repo.incrementCustomMealUsage("custom_1");

      const meals = await repo.getCustomMeals();
      expect(meals.find((m) => m.id === "custom_2")?.timesUsed).toBe(5);
    });
  });
});
