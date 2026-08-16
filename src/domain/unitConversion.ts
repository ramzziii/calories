export type UnitSystem = "metric" | "imperial";

const KG_PER_LB = 0.45359237;
const G_PER_OZ = 28.349523125;
const CM_PER_INCH = 2.54;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function gramsToOunces(g: number): number {
  return g / G_PER_OZ;
}

export function ouncesToGrams(oz: number): number {
  return oz * G_PER_OZ;
}

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH;
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

/**
 * Splits a height in cm into whole feet + rounded remaining inches, for
 * imperial display/input (e.g. 178cm -> { feet: 5, inches: 10 }).
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cmToInches(cm);
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

export function formatWeightKg(weightKg: number, system: UnitSystem): string {
  if (system === "imperial") {
    return `${Math.round(kgToLb(weightKg))} lb`;
  }
  return `${Math.round(weightKg * 10) / 10} kg`;
}

export function formatHeightCm(heightCm: number, system: UnitSystem): string {
  if (system === "imperial") {
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(heightCm)} cm`;
}

/**
 * Converts a food item's quantity for display in the given unit system.
 * Only gram-based quantities have an imperial equivalent (ounces) —
 * other units (ml, piece, slice, ...) pass through unchanged since
 * there's nothing sensible to convert them to.
 */
export function convertQuantityForDisplay(
  quantity: number,
  unit: string,
  system: UnitSystem
): { value: number; unit: string } {
  if (system === "imperial" && unit === "g") {
    return { value: Math.round(gramsToOunces(quantity) * 10) / 10, unit: "oz" };
  }
  return { value: quantity, unit };
}

/**
 * Inverse of convertQuantityForDisplay — converts a value the user typed
 * in the current display unit back to the item's canonical storage unit.
 */
export function convertQuantityToCanonical(
  value: number,
  displayUnit: string,
  canonicalUnit: string
): number {
  if (displayUnit === "oz" && canonicalUnit === "g") {
    return ouncesToGrams(value);
  }
  return value;
}

export function formatFoodQuantity(
  quantity: number,
  unit: string,
  system: UnitSystem
): string {
  const display = convertQuantityForDisplay(quantity, unit, system);
  return `${display.value}${display.unit}`;
}
