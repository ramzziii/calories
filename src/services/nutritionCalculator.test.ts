import {
  calculateBMR,
  calculateDailyTargets,
  calculateTDEE,
} from "@/services/nutritionCalculator";

describe("calculateBMR", () => {
  it("computes BMR for a male using Mifflin-St Jeor (+5)", () => {
    // 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5
    expect(calculateBMR("male", 70, 175, 25)).toBeCloseTo(1673.75, 5);
  });

  it("computes BMR for a female using Mifflin-St Jeor (-161)", () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161
    expect(calculateBMR("female", 60, 165, 30)).toBeCloseTo(1320.25, 5);
  });
});

describe("calculateTDEE", () => {
  const bmr = 1000;

  it("applies the sedentary multiplier", () => {
    expect(calculateTDEE(bmr, "sedentary")).toBeCloseTo(1200, 5);
  });

  it("applies the light multiplier", () => {
    expect(calculateTDEE(bmr, "light")).toBeCloseTo(1375, 5);
  });

  it("applies the moderate multiplier", () => {
    expect(calculateTDEE(bmr, "moderate")).toBeCloseTo(1550, 5);
  });

  it("applies the active multiplier", () => {
    expect(calculateTDEE(bmr, "active")).toBeCloseTo(1725, 5);
  });

  it("applies the very_active multiplier", () => {
    expect(calculateTDEE(bmr, "very_active")).toBeCloseTo(1900, 5);
  });
});

describe("calculateDailyTargets", () => {
  it("computes calories and macros for a maintain goal", () => {
    // bmr = 10*80 + 6.25*180 - 5*30 + 5 = 1780; tdee = 1780 * 1.55 = 2759
    const targets = calculateDailyTargets({
      sex: "male",
      weightKg: 80,
      heightCm: 180,
      age: 30,
      activityLevel: "moderate",
      goal: "maintain",
    });

    expect(targets).toEqual({
      calories: 2759,
      proteinG: 128,
      carbsG: 369,
      fatG: 86,
    });
  });

  it("uses a higher protein target and applies a deficit for a lose goal", () => {
    const targets = calculateDailyTargets({
      sex: "female",
      weightKg: 65,
      heightCm: 165,
      age: 28,
      activityLevel: "light",
      goal: "lose",
    });

    // bmr = 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
    // tdee = 1380.25 * 1.375 = 1898.34375; calories = round(1898.34375 - 500) = 1398
    expect(targets.calories).toBe(1398);
    // proteinGPerKg is 1.8 for "lose" (vs 1.6 otherwise)
    expect(targets.proteinG).toBe(Math.round(1.8 * 65));
  });

  it("applies a surplus for a gain goal", () => {
    const maintain = calculateDailyTargets({
      sex: "male",
      weightKg: 70,
      heightCm: 175,
      age: 25,
      activityLevel: "sedentary",
      goal: "maintain",
    });
    const gain = calculateDailyTargets({
      sex: "male",
      weightKg: 70,
      heightCm: 175,
      age: 25,
      activityLevel: "sedentary",
      goal: "gain",
    });

    expect(gain.calories).toBe(maintain.calories + 300);
  });

  it("never recommends below the safe floor for a male (1500 kcal)", () => {
    const targets = calculateDailyTargets({
      sex: "male",
      weightKg: 45,
      heightCm: 160,
      age: 85,
      activityLevel: "sedentary",
      goal: "lose",
    });

    expect(targets.calories).toBe(1500);
  });

  it("never recommends below the safe floor for a female (1200 kcal)", () => {
    const targets = calculateDailyTargets({
      sex: "female",
      weightKg: 40,
      heightCm: 150,
      age: 80,
      activityLevel: "sedentary",
      goal: "lose",
    });

    expect(targets.calories).toBe(1200);
  });

  it("never returns negative carbs when protein calories exceed what's left after fat", () => {
    // Short stature + high age keep BMR (and so the calorie floor) low,
    // while a still-substantial bodyweight pushes protein calories above
    // the floor's remaining budget — carbsG must clamp at 0, not go negative.
    // bmr = 10*125 + 6.25*100 - 5*99 - 161 = 1219; tdee = 1219*1.2 = 1462.8
    // tdee - 500 = 962.8 -> rounds to 963, below the 1200 floor, so it clamps.
    const targets = calculateDailyTargets({
      sex: "female",
      weightKg: 125,
      heightCm: 100,
      age: 99,
      activityLevel: "sedentary",
      goal: "lose",
    });

    expect(targets.calories).toBe(1200);
    // proteinG (225) * 4 = 900 kcal, which already exceeds calories minus
    // the 28% fat allocation (1200 - 336 = 864) — carbs would go negative
    // without the Math.max(0, ...) clamp.
    expect(targets.proteinG).toBe(225);
    expect(targets.carbsG).toBe(0);
  });
});
