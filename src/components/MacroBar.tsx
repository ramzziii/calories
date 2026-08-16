import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/theme/theme";

interface MacroBarProps {
  label: string;
  currentG: number;
  targetG: number;
  color: string;
}

export default function MacroBar({ label, currentG, targetG, color }: MacroBarProps) {
  const progress = targetG > 0 ? Math.min(1, currentG / targetG) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={typography.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(currentG)}g{" "}
          <Text style={{ color: colors.textFaint }}>/ {targetG}g</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  track: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundAlt,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
});
