import { LocalUserRepository } from "@/data/repositories/local/localUserRepository";
import { LocalMealRepository } from "@/data/repositories/local/localMealRepository";
import { LocalWeightRepository } from "@/data/repositories/local/localWeightRepository";
import {
  UserRepository,
  MealRepository,
  WeightRepository,
} from "@/data/repositories/types";

/**
 * Active repository implementations, used throughout the app via the
 * hooks below. Currently local (AsyncStorage) — swap these three lines
 * for the Supabase* equivalents once auth screens exist, and every store
 * that consumes them keeps working unchanged.
 */
const userRepository: UserRepository = new LocalUserRepository();
const mealRepository: MealRepository = new LocalMealRepository();
const weightRepository: WeightRepository = new LocalWeightRepository();

export function getUserRepository(): UserRepository {
  return userRepository;
}

export function getMealRepository(): MealRepository {
  return mealRepository;
}

export function getWeightRepository(): WeightRepository {
  return weightRepository;
}
