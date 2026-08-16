import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "@/theme/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export default function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.textOnAccent : colors.accent}
        />
      ) : (
        <Text
          style={[
            typography.button,
            variant !== "primary" && { color: colors.accent },
            variant === "ghost" && { color: colors.textMuted },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLight,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
});
