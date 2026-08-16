import React, { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, radii, shadow, spacing } from "@/theme/theme";

interface CardProps {
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function Card({
  children,
  style,
  noPadding,
}: PropsWithChildren<CardProps>) {
  return (
    <View style={[styles.card, !noPadding && styles.padding, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    ...shadow.card,
  },
  padding: {
    padding: spacing.md,
  },
});
