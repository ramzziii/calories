// ---------- User & onboarding ----------

export type Sex = "male" | "female";
export type GoalType = "lose" | "maintain" | "gain";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface UserProfile {
  id: string;
  email?: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: GoalType;
  activityLevel: ActivityLevel;
  targetWeeklyChangeKg?: number; // relevant for lose/gain
  onboardingComplete: boolean;
}

export interface DailyTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// ---------- Food & meals ----------

export interface FoodItem {
  id: string;
  name: string;
  quantity: number; // e.g. grams, or count depending on unit
  unit: string; // "g", "ml", "piece", etc.
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: "ai_vision" | "barcode" | "manual" | "custom_meal" | "database";
  barcodeUpc?: string;
  // Set true if the user has corrected this item's data — used to
  // prioritize the correction in future lookups for the same food.
  userCorrected?: boolean;
}

export interface LoggedMeal {
  id: string;
  userId: string;
  loggedAt: string; // ISO timestamp
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  photoUri?: string;
  items: FoodItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
}

export interface CustomMeal {
  id: string;
  userId: string;
  name: string;
  items: FoodItem[];
  createdAt: string;
  timesUsed: number;
}

// ---------- Weight tracking ----------

export interface WeightEntry {
  id: string;
  userId: string;
  loggedAt: string;
  weightKg: number;
}

// ---------- AI recognition service ----------

export interface RecognizedFoodItem {
  name: string;
  confidence: number; // 0-1
  estimatedQuantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  alternativeMatches?: string[]; // for the "swap food match" feature
}

export interface FoodRecognitionResult {
  items: RecognizedFoodItem[];
  rawImageUri: string;
}

// ---------- Open Food Facts ----------

export interface PackagedFoodProduct {
  barcode: string;
  name: string;
  brand?: string;
  servingSizeG?: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  imageUrl?: string;
}

// ---------- Common food database (local, curated) ----------

export interface CommonFoodItem {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

// ---------- Subscription ----------

export type SubscriptionStatus = "trial" | "active" | "expired" | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  trialEndsAt?: string;
  renewsAt?: string;
  productId?: string;
  managementUrl?: string; // deep link to App Store / Play subscription management
}
