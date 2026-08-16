import { CustomMeal, FoodItem, LoggedMeal, UserProfile, WeightEntry } from "@/types";

/**
 * Repository pattern: stores (Zustand) depend on these interfaces, never on
 * AsyncStorage or Supabase directly. This keeps business logic in the
 * stores testable with an in-memory fake, and makes swapping the local
 * implementation for a Supabase-backed one (see ../supabase) a matter of
 * changing repositoryProvider.ts — no store or screen code changes.
 */

export interface UserRepository {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  updateProfile(patch: Partial<UserProfile>): Promise<UserProfile | null>;
  clearProfile(): Promise<void>;
}

export interface MealRepository {
  getLoggedMeals(): Promise<LoggedMeal[]>;
  addLoggedMeal(meal: LoggedMeal): Promise<void>;
  updateLoggedMealItems(mealId: string, items: FoodItem[]): Promise<void>;
  removeLoggedMeal(mealId: string): Promise<void>;

  getCustomMeals(): Promise<CustomMeal[]>;
  saveCustomMeal(meal: CustomMeal): Promise<void>;
  removeCustomMeal(customMealId: string): Promise<void>;
  incrementCustomMealUsage(customMealId: string): Promise<void>;
}

export interface WeightRepository {
  getEntries(): Promise<WeightEntry[]>;
  addEntry(entry: WeightEntry): Promise<void>;
  removeEntry(id: string): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}
