import { FoodRecognitionResult, RecognizedFoodItem } from "@/types";

/**
 * Abstracted food recognition service.
 *
 * UI code should only ever call `recognizeFood()` from this file.
 * Swapping providers later (e.g. an LLM vision API) means editing
 * ONLY this file — no screens or components need to change.
 *
 * To plug in a real provider:
 *   1. Implement a function matching FoodRecognitionProvider below.
 *   2. Set ACTIVE_PROVIDER to your implementation.
 *   3. Add your API key handling (env var / secure store) here only.
 */

type FoodRecognitionProvider = (imageUri: string) => Promise<FoodRecognitionResult>;

// ---------- Mock provider (default, no API key required) ----------

const MOCK_MEALS: RecognizedFoodItem[][] = [
  [
    {
      name: "Grilled chicken breast",
      confidence: 0.93,
      estimatedQuantity: 150,
      unit: "g",
      calories: 248,
      proteinG: 46,
      carbsG: 0,
      fatG: 5,
      alternativeMatches: ["Grilled chicken thigh", "Roasted turkey breast"],
    },
    {
      name: "Steamed white rice",
      confidence: 0.88,
      estimatedQuantity: 180,
      unit: "g",
      calories: 234,
      proteinG: 4.3,
      carbsG: 51,
      fatG: 0.4,
      alternativeMatches: ["Brown rice", "Jasmine rice", "Quinoa"],
    },
    {
      name: "Steamed broccoli",
      confidence: 0.9,
      estimatedQuantity: 90,
      unit: "g",
      calories: 31,
      proteinG: 2.5,
      carbsG: 6,
      fatG: 0.3,
      alternativeMatches: ["Steamed green beans", "Roasted broccoli"],
    },
  ],
  [
    {
      name: "Avocado toast",
      confidence: 0.85,
      estimatedQuantity: 2,
      unit: "slice",
      calories: 320,
      proteinG: 8,
      carbsG: 34,
      fatG: 18,
      alternativeMatches: ["Whole grain toast with hummus"],
    },
    {
      name: "Fried egg",
      confidence: 0.91,
      estimatedQuantity: 1,
      unit: "piece",
      calories: 90,
      proteinG: 6.3,
      carbsG: 0.4,
      fatG: 7,
      alternativeMatches: ["Poached egg", "Scrambled egg"],
    },
  ],
  [
    {
      name: "Cheeseburger",
      confidence: 0.89,
      estimatedQuantity: 1,
      unit: "piece",
      calories: 540,
      proteinG: 28,
      carbsG: 40,
      fatG: 29,
      alternativeMatches: ["Turkey burger", "Veggie burger"],
    },
    {
      name: "French fries",
      confidence: 0.87,
      estimatedQuantity: 120,
      unit: "g",
      calories: 365,
      proteinG: 4,
      carbsG: 48,
      fatG: 17,
      alternativeMatches: ["Sweet potato fries", "Side salad"],
    },
  ],
];

async function mockProvider(imageUri: string): Promise<FoodRecognitionResult> {
  // Simulate network latency of a real vision API call.
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const items = MOCK_MEALS[Math.floor(Math.random() * MOCK_MEALS.length)];

  return {
    items,
    rawImageUri: imageUri,
  };
}

// ---------- Provider selection ----------

const ACTIVE_PROVIDER: FoodRecognitionProvider = mockProvider;

export async function recognizeFood(imageUri: string): Promise<FoodRecognitionResult> {
  try {
    return await ACTIVE_PROVIDER(imageUri);
  } catch (err) {
    console.error("Food recognition failed:", err);
    throw new Error(
      "We couldn't analyze that photo. Try again with better lighting, or log the meal manually."
    );
  }
}

/**
 * Example of a real provider you could swap in later:
 *
 * async function llmVisionProvider(imageUri: string): Promise<FoodRecognitionResult> {
 *   const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: "base64" });
 *   const response = await fetch("https://your-backend.com/analyze-meal", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ image: base64 }),
 *   });
 *   const data = await response.json();
 *   return { items: data.items, rawImageUri: imageUri };
 * }
 */
