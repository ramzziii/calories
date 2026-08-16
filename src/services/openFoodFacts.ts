import { PackagedFoodProduct } from "@/types";

// Open Food Facts is free and requires no API key.
// Docs: https://world.openfoodfacts.org/data
const BASE_URL = "https://world.openfoodfacts.org/api/v2/product";

interface OFFResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    serving_size?: string;
    image_front_small_url?: string;
    nutriments?: {
      "energy-kcal_100g"?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
    };
  };
}

export async function lookupBarcode(
  barcode: string
): Promise<PackagedFoodProduct | null> {
  const url = `${BASE_URL}/${barcode}.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Open Food Facts lookup failed.");
  }

  const data: OFFResponse = await response.json();

  if (data.status !== 1 || !data.product) {
    return null; // not found — caller should fall back to manual entry
  }

  const p = data.product;
  const n = p.nutriments ?? {};

  return {
    barcode,
    name: p.product_name?.trim() || "Unknown product",
    brand: p.brands?.split(",")[0]?.trim(),
    servingSizeG: parseServingSize(p.serving_size),
    caloriesPer100g: n["energy-kcal_100g"] ?? 0,
    proteinPer100g: n.proteins_100g ?? 0,
    carbsPer100g: n.carbohydrates_100g ?? 0,
    fatPer100g: n.fat_100g ?? 0,
    imageUrl: p.image_front_small_url,
  };
}

function parseServingSize(raw?: string): number | undefined {
  if (!raw) return undefined;
  const match = raw.match(/([\d.]+)\s*g/i);
  return match ? parseFloat(match[1]) : undefined;
}

// Scales a per-100g product to a given quantity in grams.
export function scaleToQuantity(product: PackagedFoodProduct, quantityG: number) {
  const factor = quantityG / 100;
  return {
    calories: Math.round(product.caloriesPer100g * factor),
    proteinG: Math.round(product.proteinPer100g * factor * 10) / 10,
    carbsG: Math.round(product.carbsPer100g * factor * 10) / 10,
    fatG: Math.round(product.fatPer100g * factor * 10) / 10,
  };
}
