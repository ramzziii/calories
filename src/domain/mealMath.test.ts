import { FoodItem } from "@/types";
import {
  inferMealTypeFromHour,
  roundTo,
  scaleFoodItemToQuantity,
  sumFoodItems,
} from "@/domain/mealMath";

function makeItem(overrides: Partial<FoodItem> = {}): FoodItem {
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

describe("sumFoodItems", () => {
  it("returns zeroed totals for an empty array", () => {
    expect(sumFoodItems([])).toEqual({
      totalCalories: 0,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatG: 0,
    });
  });

  it("sums a single item's macros directly", () => {
    const item = makeItem();
    expect(sumFoodItems([item])).toEqual({
      totalCalories: 165,
      totalProteinG: 31,
      totalCarbsG: 0,
      totalFatG: 3.6,
    });
  });

  it("sums multiple items across all macros", () => {
    const items = [
      makeItem({ calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }),
      makeItem({ calories: 200, proteinG: 5, carbsG: 40, fatG: 2 }),
    ];
    expect(sumFoodItems(items)).toEqual({
      totalCalories: 365,
      totalProteinG: 36,
      totalCarbsG: 40,
      totalFatG: 5.6,
    });
  });
});

describe("scaleFoodItemToQuantity", () => {
  const base = makeItem({
    quantity: 100,
    calories: 200,
    proteinG: 20,
    carbsG: 10,
    fatG: 5,
  });

  it("scales macros proportionally when doubling quantity", () => {
    expect(scaleFoodItemToQuantity(base, 200)).toEqual({
      calories: 400,
      proteinG: 40,
      carbsG: 20,
      fatG: 10,
    });
  });

  it("scales macros proportionally when halving quantity", () => {
    expect(scaleFoodItemToQuantity(base, 50)).toEqual({
      calories: 100,
      proteinG: 10,
      carbsG: 5,
      fatG: 2.5,
    });
  });

  it("returns unchanged macros when the new quantity equals the baseline", () => {
    expect(scaleFoodItemToQuantity(base, 100)).toEqual({
      calories: 200,
      proteinG: 20,
      carbsG: 10,
      fatG: 5,
    });
  });

  it("zeroes out macros for a zero quantity (a valid scale-down, not an error)", () => {
    expect(scaleFoodItemToQuantity(base, 0)).toEqual({
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    });
  });

  it("falls back to the original macros for a negative quantity", () => {
    expect(scaleFoodItemToQuantity(base, -50)).toEqual({
      calories: 200,
      proteinG: 20,
      carbsG: 10,
      fatG: 5,
    });
  });

  it("falls back to the original macros for a NaN quantity", () => {
    expect(scaleFoodItemToQuantity(base, NaN)).toEqual({
      calories: 200,
      proteinG: 20,
      carbsG: 10,
      fatG: 5,
    });
  });

  it("falls back to the original macros for a non-finite (Infinity) quantity", () => {
    expect(scaleFoodItemToQuantity(base, Infinity)).toEqual({
      calories: 200,
      proteinG: 20,
      carbsG: 10,
      fatG: 5,
    });
    expect(scaleFoodItemToQuantity(base, -Infinity)).toEqual({
      calories: 200,
      proteinG: 20,
      carbsG: 10,
      fatG: 5,
    });
  });

  it("treats a zero or negative baseline quantity as 1 to avoid divide-by-zero", () => {
    const zeroBaselineItem = makeItem({
      quantity: 0,
      calories: 50,
      proteinG: 5,
      carbsG: 2,
      fatG: 1,
    });
    // baseline becomes 1, so factor = newQuantity / 1 = newQuantity
    expect(scaleFoodItemToQuantity(zeroBaselineItem, 3)).toEqual({
      calories: 150,
      proteinG: 15,
      carbsG: 6,
      fatG: 3,
    });

    const negativeBaselineItem = makeItem({
      quantity: -10,
      calories: 50,
      proteinG: 5,
      carbsG: 2,
      fatG: 1,
    });
    expect(scaleFoodItemToQuantity(negativeBaselineItem, 3)).toEqual({
      calories: 150,
      proteinG: 15,
      carbsG: 6,
      fatG: 3,
    });
  });

  it("rounds calories to whole numbers and other macros to one decimal", () => {
    const item = makeItem({ quantity: 3, calories: 10, proteinG: 1, carbsG: 1, fatG: 1 });
    const result = scaleFoodItemToQuantity(item, 1);
    // factor = 1/3
    expect(result).toEqual({
      calories: 3, // 3.33... rounded to 0 decimals
      proteinG: 0.3,
      carbsG: 0.3,
      fatG: 0.3,
    });
  });
});

describe("roundTo", () => {
  it("rounds to zero decimals", () => {
    expect(roundTo(2.4, 0)).toBe(2);
    expect(roundTo(2.5, 0)).toBe(3);
  });

  it("rounds to one decimal", () => {
    expect(roundTo(1.234, 1)).toBe(1.2);
    expect(roundTo(1.25, 1)).toBe(1.3);
  });

  it("rounds to two decimals", () => {
    expect(roundTo(1.005, 2)).toBeCloseTo(1.0, 2);
    expect(roundTo(3.14159, 2)).toBe(3.14);
  });
});

describe("inferMealTypeFromHour", () => {
  it("returns breakfast before 11:00", () => {
    expect(inferMealTypeFromHour(0)).toBe("breakfast");
    expect(inferMealTypeFromHour(6)).toBe("breakfast");
    expect(inferMealTypeFromHour(10)).toBe("breakfast");
  });

  it("returns lunch from 11:00 up to (not including) 16:00", () => {
    expect(inferMealTypeFromHour(11)).toBe("lunch");
    expect(inferMealTypeFromHour(13)).toBe("lunch");
    expect(inferMealTypeFromHour(15)).toBe("lunch");
  });

  it("returns dinner from 16:00 up to (not including) 21:00", () => {
    expect(inferMealTypeFromHour(16)).toBe("dinner");
    expect(inferMealTypeFromHour(18)).toBe("dinner");
    expect(inferMealTypeFromHour(20)).toBe("dinner");
  });

  it("returns snack from 21:00 onward", () => {
    expect(inferMealTypeFromHour(21)).toBe("snack");
    expect(inferMealTypeFromHour(23)).toBe("snack");
  });
});
