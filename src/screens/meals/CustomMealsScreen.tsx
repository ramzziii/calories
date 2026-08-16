import React, { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMealStore } from "@/store/useMealStore";
import Card from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme/theme";

export default function CustomMealsScreen() {
  const customMeals = useMealStore((s) => s.customMeals);
  const logCustomMeal = useMealStore((s) => s.logCustomMeal);
  const removeCustomMeal = useMealStore((s) => s.removeCustomMeal);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleLog = async (customMealId: string) => {
    setPendingId(customMealId);
    try {
      await logCustomMeal(customMealId);
    } catch {
      Alert.alert(
        "Couldn't log this meal",
        "Something went wrong saving this to your log. Please try again."
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (customMealId: string) => {
    try {
      await removeCustomMeal(customMealId);
    } catch {
      Alert.alert("Couldn't remove this meal", "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={typography.h1}>Custom meals</Text>
      <Text
        style={[
          typography.bodyMuted,
          { marginTop: spacing.xs, marginBottom: spacing.md },
        ]}
      >
        Log a saved meal instantly — no rescanning your usual breakfast.
      </Text>

      <FlatList
        data={customMeals}
        keyExtractor={(m) => m.id}
        contentContainerStyle={customMeals.length === 0 && { flexGrow: 1 }}
        ListEmptyComponent={
          <Card>
            <Text style={typography.bodyMuted}>
              No custom meals yet. After scanning a meal, tap "Save as a custom meal" to
              add one here.
            </Text>
          </Card>
        }
        renderItem={({ item }) => {
          const calories = item.items.reduce((sum, i) => sum + i.calories, 0);
          const isPending = pendingId === item.id;
          return (
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h2}>{item.name}</Text>
                  <Text style={typography.bodyMuted}>
                    {Math.round(calories)} cal · used {item.timesUsed}x
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleLog(item.id)}
                  disabled={isPending}
                  style={[styles.logButton, isPending && { opacity: 0.6 }]}
                >
                  <Text style={styles.logButtonText}>
                    {isPending ? "Logging..." : "Log now"}
                  </Text>
                </Pressable>
              </View>
              <Pressable onPress={() => handleRemove(item.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  logButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logButtonText: {
    color: colors.textOnAccent,
    fontWeight: "700",
  },
  removeText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
});
