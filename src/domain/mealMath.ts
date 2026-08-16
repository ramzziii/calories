import { FoodItem } from "@/types";

export interface MealTotals {
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
}

/**
 * Sums an array of food items into meal-level totals. Returns zeroed
 * totals for an empty array rather than throwing — a meal with all items
 * removed is a valid (if unusual) state, not an error.
 */
export function sumFoodItems(items: FoodItem[]): MealTotals {
  return items.reduce<MealTotals>(
    (acc, item) => ({
      totalCalories: acc.totalCalories + item.calories,
      totalProteinG: acc.totalProteinG + item.proteinG,
      totalCarbsG: acc.totalCarbsG + item.carbsG,
      totalFatG: acc.totalFatG + item.fatG,
    }),
    { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0 }
  );
}

/**
 * Scales a food item's macros proportionally to a new quantity, based on
 * its current quantity as the baseline. Used when a user edits an
 * ingredient's quantity in FoodItemEditScreen.
 *
 * Guards against divide-by-zero and non-finite input, which would
 * otherwise silently produce NaN macros that then propagate into meal
 * totals and the dashboard.
 */
type ScalableFields =
  | "quantity"
  | "calories"
  | "proteinG"
  | "carbsG"
  | "fatG"
  | "fiberG"
  | "sugarG"
  | "sodiumMg";

export function scaleFoodItemToQuantity(
  item: Pick<FoodItem, ScalableFields>,
  newQuantity: number
): Pick<FoodItem, Exclude<ScalableFields, "quantity">> {
  if (!Number.isFinite(newQuantity) || newQuantity < 0) {
    return {
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      fiberG: item.fiberG,
      sugarG: item.sugarG,
      sodiumMg: item.sodiumMg,
    };
  }

  const baseline = item.quantity > 0 ? item.quantity : 1;
  const factor = newQuantity / baseline;

  return {
    calories: roundTo(item.calories * factor, 0),
    proteinG: roundTo(item.proteinG * factor, 1),
    carbsG: roundTo(item.carbsG * factor, 1),
    fatG: roundTo(item.fatG * factor, 1),
    fiberG: item.fiberG !== undefined ? roundTo(item.fiberG * factor, 1) : undefined,
    sugarG: item.sugarG !== undefined ? roundTo(item.sugarG * factor, 1) : undefined,
    sodiumMg:
      item.sodiumMg !== undefined ? roundTo(item.sodiumMg * factor, 0) : undefined,
  };
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

/**
 * Infers a meal type from the current time of day. Extracted as a pure
 * function (rather than three separate copies) so behavior around
 * boundary times (11:00, 16:00, 21:00) is consistent and independently
 * testable.
 */
export function inferMealTypeFromHour(hour: number): MealType {
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}
