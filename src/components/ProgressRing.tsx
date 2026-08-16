import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, typography } from "@/theme/theme";

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-1
  label: string;
  value: string;
  color?: string;
}

export default function ProgressRing({
  size = 180,
  strokeWidth = 14,
  progress,
  label,
  value,
  color = colors.accent,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accentSoft}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[typography.display, { fontSize: size * 0.19 }]}>{value}</Text>
        <Text style={typography.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
