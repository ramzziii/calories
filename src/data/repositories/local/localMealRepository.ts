import { CustomMeal, FoodItem, LoggedMeal } from "@/types";
import { MealRepository } from "@/data/repositories/types";
import { readJson, STORAGE_KEYS, writeJson } from "@/data/repositories/local/storage";
import { sumFoodItems } from "@/domain/mealMath";

export class LocalMealRepository implements MealRepository {
  async getLoggedMeals(): Promise<LoggedMeal[]> {
    return readJson<LoggedMeal[]>(STORAGE_KEYS.loggedMeals, []);
  }

  async addLoggedMeal(meal: LoggedMeal): Promise<void> {
    const meals = await this.getLoggedMeals();
    await writeJson(STORAGE_KEYS.loggedMeals, [...meals, meal]);
  }

  async updateLoggedMealItems(mealId: string, items: FoodItem[]): Promise<void> {
    const meals = await this.getLoggedMeals();
    const totals = sumFoodItems(items);
    const updated = meals.map((m) => (m.id === mealId ? { ...m, items, ...totals } : m));
    await writeJson(STORAGE_KEYS.loggedMeals, updated);
  }

  async removeLoggedMeal(mealId: string): Promise<void> {
    const meals = await this.getLoggedMeals();
    await writeJson(
      STORAGE_KEYS.loggedMeals,
      meals.filter((m) => m.id !== mealId)
    );
  }

  async getCustomMeals(): Promise<CustomMeal[]> {
    return readJson<CustomMeal[]>(STORAGE_KEYS.customMeals, []);
  }

  async saveCustomMeal(meal: CustomMeal): Promise<void> {
    const meals = await this.getCustomMeals();
    await writeJson(STORAGE_KEYS.customMeals, [...meals, meal]);
  }

  async removeCustomMeal(customMealId: string): Promise<void> {
    const meals = await this.getCustomMeals();
    await writeJson(
      STORAGE_KEYS.customMeals,
      meals.filter((m) => m.id !== customMealId)
    );
  }

  async incrementCustomMealUsage(customMealId: string): Promise<void> {
    const meals = await this.getCustomMeals();
    const updated = meals.map((m) =>
      m.id === customMealId ? { ...m, timesUsed: m.timesUsed + 1 } : m
    );
    await writeJson(STORAGE_KEYS.customMeals, updated);
  }
}
