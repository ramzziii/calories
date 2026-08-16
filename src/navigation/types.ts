import { GoalType, Sex, ActivityLevel } from "@/types";

export type OnboardingStackParamList = {
  Welcome: undefined;
  Goals: undefined;
  Stats: undefined;
  ActivityLevel: undefined;
  Summary: undefined;
};

export type OnboardingDraft = {
  goal?: GoalType;
  sex?: Sex;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  MealsTab: undefined;
  WeightTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  Onboarding: undefined;
  Main: undefined;
  CameraCapture: undefined;
  DescribeMeal: undefined;
  ScanResults: { imageUri: string } | { textDescription: string };
  FoodItemEdit: { mealId: string; itemId: string };
  AddIngredient: { mealId: string };
  BarcodeScanner: undefined;
  SaveMeal: { items: string }; // JSON-serialized FoodItem[]
  Paywall: { context?: "onboarding" | "feature_gate" | "trial_expired" | "daily_limit" };
  Support: undefined;
  FAQ: undefined;
  Subscription: undefined;
};
