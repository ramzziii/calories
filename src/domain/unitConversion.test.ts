import {
  cmToFeetInches,
  cmToInches,
  convertQuantityForDisplay,
  convertQuantityToCanonical,
  feetInchesToCm,
  formatFoodQuantity,
  formatHeightCm,
  formatWeightKg,
  gramsToOunces,
  inchesToCm,
  kgToLb,
  lbToKg,
  ouncesToGrams,
} from "@/domain/unitConversion";

describe("weight conversions", () => {
  it("converts kg to lb and back", () => {
    expect(kgToLb(1)).toBeCloseTo(2.20462, 4);
    expect(lbToKg(2.20462)).toBeCloseTo(1, 4);
  });

  it("round-trips kg -> lb -> kg", () => {
    expect(lbToKg(kgToLb(70))).toBeCloseTo(70, 6);
  });
});

describe("grams/ounces conversions", () => {
  it("converts grams to ounces and back", () => {
    expect(gramsToOunces(28.349523125)).toBeCloseTo(1, 6);
    expect(ouncesToGrams(1)).toBeCloseTo(28.349523125, 6);
  });

  it("round-trips grams -> ounces -> grams", () => {
    expect(ouncesToGrams(gramsToOunces(150))).toBeCloseTo(150, 6);
  });
});

describe("cm/inches conversions", () => {
  it("converts cm to inches and back", () => {
    expect(cmToInches(2.54)).toBeCloseTo(1, 6);
    expect(inchesToCm(1)).toBeCloseTo(2.54, 6);
  });
});

describe("cmToFeetInches", () => {
  it("splits a height into whole feet and rounded inches", () => {
    expect(cmToFeetInches(180)).toEqual({ feet: 5, inches: 11 });
  });

  it("rolls inches over into an extra foot when rounding hits 12", () => {
    // 181.61cm = 71.5 total inches -> feet=5, remainder rounds to 12
    expect(cmToFeetInches(181.61)).toEqual({ feet: 6, inches: 0 });
  });

  it("round-trips feet/inches -> cm -> feet/inches", () => {
    expect(cmToFeetInches(feetInchesToCm(5, 10))).toEqual({ feet: 5, inches: 10 });
  });
});

describe("feetInchesToCm", () => {
  it("converts feet and inches to cm", () => {
    expect(feetInchesToCm(5, 10)).toBeCloseTo(177.8, 4);
  });

  it("treats feet as the dominant unit (12 inches per foot)", () => {
    expect(feetInchesToCm(6, 0)).toBeCloseTo(feetInchesToCm(5, 12), 6);
  });
});

describe("formatWeightKg", () => {
  it("formats as whole-number pounds when imperial", () => {
    expect(formatWeightKg(70, "imperial")).toBe("154 lb");
  });

  it("formats as kg to one decimal when metric", () => {
    expect(formatWeightKg(70.456, "metric")).toBe("70.5 kg");
  });
});

describe("formatHeightCm", () => {
  it("formats as feet'inches\" when imperial", () => {
    expect(formatHeightCm(180, "imperial")).toBe(`5'11"`);
  });

  it("formats as whole-number cm when metric", () => {
    expect(formatHeightCm(180.4, "metric")).toBe("180 cm");
  });
});

describe("convertQuantityForDisplay", () => {
  it("converts grams to ounces when imperial", () => {
    expect(convertQuantityForDisplay(100, "g", "imperial")).toEqual({
      value: 3.5,
      unit: "oz",
    });
  });

  it("leaves grams unchanged when metric", () => {
    expect(convertQuantityForDisplay(100, "g", "metric")).toEqual({
      value: 100,
      unit: "g",
    });
  });

  it("leaves non-gram units unchanged regardless of system", () => {
    expect(convertQuantityForDisplay(2, "piece", "imperial")).toEqual({
      value: 2,
      unit: "piece",
    });
    expect(convertQuantityForDisplay(50, "ml", "imperial")).toEqual({
      value: 50,
      unit: "ml",
    });
  });
});

describe("convertQuantityToCanonical", () => {
  it("converts an oz display value back to grams", () => {
    expect(convertQuantityToCanonical(3.5, "oz", "g")).toBeCloseTo(99.223, 2);
  });

  it("passes the value through unchanged when not an oz->g conversion", () => {
    expect(convertQuantityToCanonical(100, "g", "g")).toBe(100);
    expect(convertQuantityToCanonical(2, "piece", "piece")).toBe(2);
  });
});

describe("formatFoodQuantity", () => {
  it("formats gram quantities as ounces when imperial", () => {
    expect(formatFoodQuantity(100, "g", "imperial")).toBe("3.5oz");
  });

  it("formats gram quantities as grams when metric", () => {
    expect(formatFoodQuantity(100, "g", "metric")).toBe("100g");
  });

  it("leaves non-gram units as-is", () => {
    expect(formatFoodQuantity(2, "piece", "imperial")).toBe("2piece");
  });
});
