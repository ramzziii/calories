import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import FoodItemCard from "@/components/FoodItemCard";
import { FoodItem } from "@/types";

function makeItem(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: "item_1",
    name: "Grilled chicken",
    quantity: 150,
    unit: "g",
    calories: 247.6,
    proteinG: 46.5,
    carbsG: 0,
    fatG: 5.4,
    source: "manual",
    ...overrides,
  };
}

describe("FoodItemCard", () => {
  it("renders the item's name, quantity, calories, and rounded macros", () => {
    render(<FoodItemCard item={makeItem()} onPress={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByText("Grilled chicken")).toBeTruthy();
    expect(screen.getByText("150g · 248 cal")).toBeTruthy();
    expect(screen.getByText("P 47g")).toBeTruthy();
    expect(screen.getByText("C 0g")).toBeTruthy();
    expect(screen.getByText("F 5g")).toBeTruthy();
  });

  it("does not show the 'edited' badge for an unmodified item", () => {
    render(<FoodItemCard item={makeItem()} onPress={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.queryByText("edited")).toBeNull();
  });

  it("shows the 'edited' badge when the item was user-corrected", () => {
    render(
      <FoodItemCard
        item={makeItem({ userCorrected: true })}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("edited")).toBeTruthy();
  });

  it("calls onPress when the row is pressed", () => {
    const onPress = jest.fn();
    render(<FoodItemCard item={makeItem()} onPress={onPress} onDelete={jest.fn()} />);

    fireEvent.press(screen.getByText("Grilled chicken"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete (and not onPress) when Remove is pressed", () => {
    const onPress = jest.fn();
    const onDelete = jest.fn();
    render(<FoodItemCard item={makeItem()} onPress={onPress} onDelete={onDelete} />);

    fireEvent.press(screen.getByText("Remove"));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
