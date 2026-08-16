import { supabase } from "@/services/supabase";
import { CustomMeal, FoodItem, LoggedMeal } from "@/types";
import { RepositoryError, MealRepository } from "@/data/repositories/types";
import { sumFoodItems } from "@/domain/mealMath";

/** NOT YET ACTIVE — see the note in supabaseUserRepository.ts. */
export class SupabaseMealRepository implements MealRepository {
  async getLoggedMeals(): Promise<LoggedMeal[]> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await supabase
      .from("logged_meals")
      .select("*, food_items(*)")
      .eq("user_id", auth.user.id)
      .order("logged_at", { ascending: false });

    if (error) throw new RepositoryError("Failed to fetch logged meals", error);

    return (data ?? []).map(mapLoggedMealRow);
  }

  async addLoggedMeal(meal: LoggedMeal): Promise<void> {
    const { error: mealError } = await supabase.from("logged_meals").insert({
      id: meal.id,
      user_id: meal.userId,
      logged_at: meal.loggedAt,
      meal_type: meal.mealType,
      photo_url: meal.photoUri,
      total_calories: meal.totalCalories,
      total_protein_g: meal.totalProteinG,
      total_carbs_g: meal.totalCarbsG,
      total_fat_g: meal.totalFatG,
    });
    if (mealError) throw new RepositoryError("Failed to add logged meal", mealError);

    if (meal.items.length > 0) {
      const { error: itemsError } = await supabase
        .from("food_items")
        .insert(meal.items.map((item) => foodItemToRow(item, { loggedMealId: meal.id })));
      if (itemsError) throw new RepositoryError("Failed to add meal items", itemsError);
    }
  }

  async updateLoggedMealItems(mealId: string, items: FoodItem[]): Promise<void> {
    const totals = sumFoodItems(items);

    const { error: deleteError } = await supabase
      .from("food_items")
      .delete()
      .eq("logged_meal_id", mealId);
    if (deleteError)
      throw new RepositoryError("Failed to update meal items", deleteError);

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from("food_items")
        .insert(items.map((item) => foodItemToRow(item, { loggedMealId: mealId })));
      if (insertError)
        throw new RepositoryError("Failed to update meal items", insertError);
    }

    const { error: totalsError } = await supabase
      .from("logged_meals")
      .update({
        total_calories: totals.totalCalories,
        total_protein_g: totals.totalProteinG,
        total_carbs_g: totals.totalCarbsG,
        total_fat_g: totals.totalFatG,
      })
      .eq("id", mealId);
    if (totalsError)
      throw new RepositoryError("Failed to update meal totals", totalsError);
  }

  async removeLoggedMeal(mealId: string): Promise<void> {
    const { error } = await supabase.from("logged_meals").delete().eq("id", mealId);
    if (error) throw new RepositoryError("Failed to remove logged meal", error);
  }

  async getCustomMeals(): Promise<CustomMeal[]> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await supabase
      .from("custom_meals")
      .select("*, food_items(*)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) throw new RepositoryError("Failed to fetch custom meals", error);

    return (data ?? []).map(mapCustomMealRow);
  }

  async saveCustomMeal(meal: CustomMeal): Promise<void> {
    const { error: mealError } = await supabase.from("custom_meals").insert({
      id: meal.id,
      user_id: meal.userId,
      name: meal.name,
      times_used: meal.timesUsed,
      created_at: meal.createdAt,
    });
    if (mealError) throw new RepositoryError("Failed to save custom meal", mealError);

    if (meal.items.length > 0) {
      const { error: itemsError } = await supabase
        .from("food_items")
        .insert(meal.items.map((item) => foodItemToRow(item, { customMealId: meal.id })));
      if (itemsError)
        throw new RepositoryError("Failed to save custom meal items", itemsError);
    }
  }

  async removeCustomMeal(customMealId: string): Promise<void> {
    const { error } = await supabase.from("custom_meals").delete().eq("id", customMealId);
    if (error) throw new RepositoryError("Failed to remove custom meal", error);
  }

  async incrementCustomMealUsage(customMealId: string): Promise<void> {
    const { error } = await supabase.rpc("increment_custom_meal_usage", {
      meal_id: customMealId,
    });
    if (error) throw new RepositoryError("Failed to update custom meal usage", error);
  }
}

// ---------- row <-> domain mapping ----------

function foodItemToRow(
  item: FoodItem,
  parent: { loggedMealId?: string; customMealId?: string }
) {
  return {
    id: item.id,
    logged_meal_id: parent.loggedMealId ?? null,
    custom_meal_id: parent.customMealId ?? null,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories,
    protein_g: item.proteinG,
    carbs_g: item.carbsG,
    fat_g: item.fatG,
    source: item.source,
    barcode_upc: item.barcodeUpc ?? null,
    user_corrected: item.userCorrected ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFoodItemRow(row: any): FoodItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    source: row.source,
    barcodeUpc: row.barcode_upc ?? undefined,
    userCorrected: row.user_corrected ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLoggedMealRow(row: any): LoggedMeal {
  return {
    id: row.id,
    userId: row.user_id,
    loggedAt: row.logged_at,
    mealType: row.meal_type,
    photoUri: row.photo_url ?? undefined,
    items: (row.food_items ?? []).map(mapFoodItemRow),
    totalCalories: row.total_calories,
    totalProteinG: row.total_protein_g,
    totalCarbsG: row.total_carbs_g,
    totalFatG: row.total_fat_g,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomMealRow(row: any): CustomMeal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    items: (row.food_items ?? []).map(mapFoodItemRow),
    createdAt: row.created_at,
    timesUsed: row.times_used,
  };
}
