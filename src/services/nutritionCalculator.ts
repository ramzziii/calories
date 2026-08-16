import { ActivityLevel, DailyTargets, GoalType, Sex } from "@/types";

// Mifflin-St Jeor BMR formula — the standard used by most reputable
// nutrition/calorie apps.
export function calculateBMR(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // little or no exercise
  light: 1.375, // light exercise 1-3 days/week
  moderate: 1.55, // moderate exercise 3-5 days/week
  active: 1.725, // hard exercise 6-7 days/week
  very_active: 1.9, // very hard exercise & physical job
};

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

// A conservative, sustainable default: ~0.5kg/week change,
// which is roughly a 500 kcal/day deficit or surplus.
const CALORIE_ADJUSTMENT_PER_GOAL: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300, // smaller surplus by default to limit fat gain
};

export function calculateDailyTargets(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
}): DailyTargets {
  const { sex, weightKg, heightCm, age, activityLevel, goal } = params;

  const bmr = calculateBMR(sex, weightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const adjustment = CALORIE_ADJUSTMENT_PER_GOAL[goal];

  // Never recommend below a safe floor.
  const SAFE_FLOOR = sex === "male" ? 1500 : 1200;
  const calories = Math.max(SAFE_FLOOR, Math.round(tdee + adjustment));

  // Macro split: protein prioritized for satiety/muscle retention,
  // fat given a sensible floor, remainder to carbs.
  const proteinGPerKg = goal === "lose" ? 1.8 : 1.6;
  const proteinG = Math.round(proteinGPerKg * weightKg);
  const fatCalories = calories * 0.28;
  const fatG = Math.round(fatCalories / 9);
  const proteinCalories = proteinG * 4;
  const carbsCalories = Math.max(0, calories - proteinCalories - fatCalories);
  const carbsG = Math.round(carbsCalories / 4);

  return { calories, proteinG, carbsG, fatG };
}
