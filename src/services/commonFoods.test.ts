import { COMMON_FOODS, scaleFood, searchFoods } from "@/services/commonFoods";

describe("COMMON_FOODS", () => {
  it("has a substantial, non-empty curated list", () => {
    expect(COMMON_FOODS.length).toBeGreaterThan(150);
  });

  it("has unique names (used as list keys in the UI)", () => {
    const names = COMMON_FOODS.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has plausible nutrition values for every entry", () => {
    for (const food of COMMON_FOODS) {
      expect(food.caloriesPer100g).toBeGreaterThan(0);
      expect(food.proteinPer100g).toBeGreaterThanOrEqual(0);
      expect(food.carbsPer100g).toBeGreaterThanOrEqual(0);
      expect(food.fatPer100g).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("searchFoods", () => {
  it("returns an empty array for an empty or whitespace query", () => {
    expect(searchFoods("")).toEqual([]);
    expect(searchFoods("   ")).toEqual([]);
  });

  it("finds a food by exact name, case-insensitively", () => {
    const results = searchFoods("avocado");
    expect(results.some((f) => f.name === "Avocado")).toBe(true);
  });

  it("matches case-insensitively regardless of query casing", () => {
    expect(searchFoods("AVOCADO")).toEqual(searchFoods("avocado"));
  });

  it("ranks prefix matches before other substring matches", () => {
    // "Rice cake" starts with "rice"; "White rice (cooked)" merely
    // contains it — the prefix match should rank first.
    const names = searchFoods("rice", 10).map((f) => f.name);
    expect(names).toContain("Rice cake");
    expect(names).toContain("White rice (cooked)");
    expect(names.indexOf("Rice cake")).toBeLessThan(names.indexOf("White rice (cooked)"));
  });

  it("respects the limit parameter", () => {
    const results = searchFoods("a", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchFoods("xyznonexistentfood")).toEqual([]);
  });
});

describe("scaleFood", () => {
  const food = {
    name: "Test food",
    caloriesPer100g: 200,
    proteinPer100g: 20,
    carbsPer100g: 10,
    fatPer100g: 5,
  };

  it("scales macros proportionally to the given quantity", () => {
    expect(scaleFood(food, 200)).toEqual({
      calories: 400,
      proteinG: 40,
      carbsG: 20,
      fatG: 10,
    });
  });

  it("returns zeroed macros for a zero quantity", () => {
    expect(scaleFood(food, 0)).toEqual({
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    });
  });

  it("rounds calories to whole numbers and macros to one decimal", () => {
    const result = scaleFood(food, 33);
    // factor = 0.33 -> calories = 66, protein = 6.6, carbs = 3.3, fat = 1.65 -> 1.7 (rounds to 1 decimal)
    expect(result.calories).toBe(66);
    expect(result.proteinG).toBe(6.6);
    expect(result.carbsG).toBe(3.3);
    expect(result.fatG).toBe(1.7);
  });
});
