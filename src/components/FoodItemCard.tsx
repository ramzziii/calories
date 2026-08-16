import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/theme/theme";
import { FoodItem } from "@/types";

interface FoodItemCardProps {
  item: FoodItem;
  onPress: () => void;
  onDelete: () => void;
}

// This card is what makes ingredient-level editing possible: every
// detected food item renders as its own tappable row, with its own
// delete action — no more "delete the whole meal to fix one item."
export default function FoodItemCard({ item, onPress, onDelete }: FoodItemCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.userCorrected && (
            <View style={styles.correctedBadge}>
              <Text style={styles.correctedText}>edited</Text>
            </View>
          )}
        </View>
        <Text style={styles.quantity}>
          {item.quantity}
          {item.unit} · {Math.round(item.calories)} cal
        </Text>
        <View style={styles.macroRow}>
          <Text style={styles.macroText}>P {Math.round(item.proteinG)}g</Text>
          <Text style={styles.macroText}>C {Math.round(item.carbsG)}g</Text>
          <Text style={styles.macroText}>F {Math.round(item.fatG)}g</Text>
        </View>
      </View>
      <Pressable onPress={onDelete} hitSlop={12} style={styles.deleteButton}>
        <Text style={styles.deleteText}>Remove</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  name: {
    ...typography.h2,
    fontSize: 16,
  },
  correctedBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  correctedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accentDark,
    textTransform: "uppercase",
  },
  quantity: {
    ...typography.bodyMuted,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 4,
  },
  macroText: {
    fontSize: 12,
    color: colors.textFaint,
    fontWeight: "600",
  },
  deleteButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deleteText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "600",
  },
});
