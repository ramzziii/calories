import React from "react";
import { Circle } from "react-native-svg";
import { render, screen } from "@testing-library/react-native";
import ProgressRing from "@/components/ProgressRing";

function getProgressCircle() {
  // The second <Circle> is the progress arc (the first is the static track).
  return screen.UNSAFE_getAllByType(Circle)[1];
}

describe("ProgressRing", () => {
  it("renders the label and value text", () => {
    render(<ProgressRing progress={0.5} label="cal left" value="1,200" />);

    expect(screen.getByText("cal left")).toBeTruthy();
    expect(screen.getByText("1,200")).toBeTruthy();
  });

  it("computes strokeDashoffset proportionally for a mid-range progress value", () => {
    const size = 180;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    render(
      <ProgressRing
        size={size}
        strokeWidth={strokeWidth}
        progress={0.5}
        label="cal left"
        value="500"
      />
    );

    const circle = getProgressCircle();
    expect(circle.props.strokeDasharray).toBe(circumference);
    expect(circle.props.strokeDashoffset).toBeCloseTo(circumference * 0.5, 5);
  });

  it("clamps progress above 1 to a full ring (zero offset)", () => {
    render(<ProgressRing progress={1.5} label="cal left" value="0" />);
    const circle = getProgressCircle();
    expect(circle.props.strokeDashoffset).toBeCloseTo(0, 5);
  });

  it("clamps negative progress to an empty ring (offset == circumference)", () => {
    const size = 180;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    render(<ProgressRing progress={-0.3} label="cal left" value="0" />);
    const circle = getProgressCircle();
    expect(circle.props.strokeDashoffset).toBeCloseTo(circumference, 5);
  });
});
