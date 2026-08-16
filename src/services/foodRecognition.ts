import { File } from "expo-file-system";
import { isSupabaseConfigured, supabase } from "@/services/supabase";
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

// ---------- OpenAI vision provider (via Supabase Edge Function) ----------
//
// The actual OpenAI call happens server-side in
// supabase/functions/analyze-meal — the API key must never live in the
// app bundle. This just reads the photo as base64 and forwards it.

function mimeTypeForExtension(extension: string): string {
  switch (extension.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".heic":
      return "image/heic";
    case ".webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

async function openaiVisionProvider(imageUri: string): Promise<FoodRecognitionResult> {
  const file = new File(imageUri);
  const base64 = await file.base64();
  const mimeType = mimeTypeForExtension(file.extension);

  const { data, error } = await supabase.functions.invoke("analyze-meal", {
    body: { image: base64, mimeType },
  });

  if (error) throw error;

  const items = ((data?.items ?? []) as RecognizedFoodItem[]).map((item) => ({
    ...item,
    alternativeMatches: item.alternativeMatches ?? undefined,
  }));

  if (items.length === 0) {
    throw new Error("No food items were detected in that photo.");
  }

  return { items, rawImageUri: imageUri };
}

// ---------- Provider selection ----------
//
// Falls back to the mock provider until Supabase is actually configured
// (see src/services/supabase.ts) and the analyze-meal function is
// deployed with an OPENAI_API_KEY secret — so the app keeps working out
// of the box before that backend setup is done.

const ACTIVE_PROVIDER: FoodRecognitionProvider = isSupabaseConfigured
  ? openaiVisionProvider
  : mockProvider;

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
