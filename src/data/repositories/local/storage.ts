import AsyncStorage from "@react-native-async-storage/async-storage";
import { RepositoryError } from "@/data/repositories/types";

const KEY_PREFIX = "plateful:";

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new RepositoryError(`Failed to read "${key}" from local storage`, err);
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    throw new RepositoryError(`Failed to write "${key}" to local storage`, err);
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_PREFIX + key);
  } catch (err) {
    throw new RepositoryError(`Failed to remove "${key}" from local storage`, err);
  }
}

export const STORAGE_KEYS = {
  profile: "profile",
  loggedMeals: "logged_meals",
  customMeals: "custom_meals",
  weightEntries: "weight_entries",
  unitSystem: "unit_system",
} as const;
