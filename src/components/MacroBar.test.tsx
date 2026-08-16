import React from "react";
import { render, screen } from "@testing-library/react-native";
import MacroBar from "@/components/MacroBar";

function getFillWidth(color: string): string {
  const filled = screen.root.findAll(
    (node: { props: { style?: unknown } }) =>
      Array.isArray(node.props.style) &&
      node.props.style.some(
        (s: Record<string, unknown>) => s && s.backgroundColor === color
      )
  )[0];
  const widthStyle = filled.props.style.find(
    (s: Record<string, unknown>) => s && "width" in s
  );
  return widthStyle.width;
}

describe("MacroBar", () => {
  it("renders the label and rounded current/target values", () => {
    render(<MacroBar label="Protein" currentG={45.6} targetG={120} color="#C1553A" />);

    expect(screen.getByText("Protein")).toBeTruthy();
    expect(screen.getByText("46g / 120g")).toBeTruthy();
  });

  it("fills proportionally to progress toward the target", () => {
    render(<MacroBar label="Carbs" currentG={50} targetG={200} color="#D9A441" />);
    expect(getFillWidth("#D9A441")).toBe("25%");
  });

  it("clamps the fill at 100% when current exceeds target", () => {
    render(<MacroBar label="Fat" currentG={90} targetG={60} color="#7C8C64" />);
    expect(getFillWidth("#7C8C64")).toBe("100%");
  });

  it("shows a zero-width fill when the target is 0, avoiding a divide-by-zero", () => {
    render(<MacroBar label="Fat" currentG={10} targetG={0} color="#7C8C64" />);
    expect(getFillWidth("#7C8C64")).toBe("0%");
  });
});
