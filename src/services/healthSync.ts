import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type {
  ObjectTypeIdentifier,
  QuantityTypeIdentifierWriteable,
} from "@kingstinct/react-native-healthkit";
import type { NutritionRecord } from "react-native-health-connect";
import { LoggedMeal } from "@/types";

/**
 * Apple HealthKit (iOS) and Google Health Connect (Android) both require
 * native modules that Expo Go can't run — same limitation as
 * react-native-purchases (see revenuecat.ts). This only works in a
 * development build or a production build, never in Expo Go.
 *
 * IMPORTANT: unlike the rest of this app, the actual native calls below
 * have not been exercised on a real device — this environment has no
 * way to build or run a custom dev client. They're written directly
 * against each package's installed TypeScript definitions (so the
 * method names, argument shapes, and identifier strings are real, not
 * guessed from memory), and pass typecheck, but the only way to confirm
 * they behave correctly end-to-end is to try them from a dev build.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function isHealthSyncSupported(): boolean {
  return !isExpoGo && (Platform.OS === "ios" || Platform.OS === "android");
}

const HEALTHKIT_DIETARY_IDENTIFIERS: QuantityTypeIdentifierWriteable[] = [
  "HKQuantityTypeIdentifierDietaryEnergyConsumed",
  "HKQuantityTypeIdentifierDietaryProtein",
  "HKQuantityTypeIdentifierDietaryCarbohydrates",
  "HKQuantityTypeIdentifierDietaryFatTotal",
];

async function requestIosAuthorization(): Promise<boolean> {
  const HealthKit = await import("@kingstinct/react-native-healthkit");
  const available = await HealthKit.isHealthDataAvailableAsync();
  if (!available) return false;

  return HealthKit.requestAuthorization({
    toShare: HEALTHKIT_DIETARY_IDENTIFIERS,
    toRead: HEALTHKIT_DIETARY_IDENTIFIERS as ObjectTypeIdentifier[],
  });
}

async function requestAndroidAuthorization(): Promise<boolean> {
  const HealthConnect = await import("react-native-health-connect");
  const initialized = await HealthConnect.initialize();
  if (!initialized) return false;

  const granted = await HealthConnect.requestPermission([
    { accessType: "write", recordType: "Nutrition" },
  ]);
  return granted.some((p) => p.recordType === "Nutrition" && p.accessType === "write");
}

export async function requestHealthSyncPermission(): Promise<boolean> {
  if (!isHealthSyncSupported()) return false;
  try {
    return Platform.OS === "ios"
      ? await requestIosAuthorization()
      : await requestAndroidAuthorization();
  } catch (err) {
    console.warn("Health sync authorization failed:", err);
    return false;
  }
}

async function syncToHealthKit(meal: LoggedMeal): Promise<void> {
  const HealthKit = await import("@kingstinct/react-native-healthkit");
  const start = new Date(meal.loggedAt);
  const end = start;

  await HealthKit.saveQuantitySample(
    "HKQuantityTypeIdentifierDietaryEnergyConsumed",
    "kcal",
    meal.totalCalories,
    start,
    end
  );
  await HealthKit.saveQuantitySample(
    "HKQuantityTypeIdentifierDietaryProtein",
    "g",
    meal.totalProteinG,
    start,
    end
  );
  await HealthKit.saveQuantitySample(
    "HKQuantityTypeIdentifierDietaryCarbohydrates",
    "g",
    meal.totalCarbsG,
    start,
    end
  );
  await HealthKit.saveQuantitySample(
    "HKQuantityTypeIdentifierDietaryFatTotal",
    "g",
    meal.totalFatG,
    start,
    end
  );
}

async function syncToHealthConnect(meal: LoggedMeal): Promise<void> {
  const HealthConnect = await import("react-native-health-connect");
  const timestamp = new Date(meal.loggedAt).toISOString();

  const mealTypeByCategory: Record<LoggedMeal["mealType"], number> = {
    breakfast: HealthConnect.MealType.BREAKFAST,
    lunch: HealthConnect.MealType.LUNCH,
    dinner: HealthConnect.MealType.DINNER,
    snack: HealthConnect.MealType.SNACK,
  };

  const record: NutritionRecord = {
    recordType: "Nutrition",
    startTime: timestamp,
    endTime: timestamp,
    energy: { value: meal.totalCalories, unit: "kilocalories" },
    protein: { value: meal.totalProteinG, unit: "grams" },
    totalCarbohydrate: { value: meal.totalCarbsG, unit: "grams" },
    totalFat: { value: meal.totalFatG, unit: "grams" },
    mealType: mealTypeByCategory[meal.mealType],
  };

  await HealthConnect.insertRecords([record]);
}

// Fire-and-forget by design — a failed health sync should never block or
// fail the actual meal-logging action, since the meal is already saved
// locally either way. Never throws.
export async function syncMealToHealth(meal: LoggedMeal): Promise<void> {
  if (!isHealthSyncSupported()) return;
  try {
    if (Platform.OS === "ios") {
      await syncToHealthKit(meal);
    } else if (Platform.OS === "android") {
      await syncToHealthConnect(meal);
    }
  } catch (err) {
    console.warn("Failed to sync meal to Health app:", err);
  }
}
