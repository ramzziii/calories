import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useMealStore } from "@/store/useMealStore";
import { useUnitsStore } from "@/store/useUnitsStore";
import { scaleFood, searchFoods } from "@/services/commonFoods";
import { convertQuantityToCanonical } from "@/domain/unitConversion";
import { CommonFoodItem, FoodItem } from "@/types";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "AddIngredient">;
type RouteProps = { params: { mealId: string } };

const QUICK_ADD = [
  "Avocado",
  "Pasta",
  "Bread",
  "Rice",
  "Egg",
  "Banana",
  "Chicken breast",
  "Broccoli",
  "Cheese",
  "Yogurt",
  "Almonds",
  "Salmon",
];

export default function AddIngredientScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as RouteProps;
  const { mealId } = route.params;
  const addFoodItem = useMealStore((s) => s.addFoodItem);
  const unitSystem = useUnitsStore((s) => s.system);
  const isImperial = unitSystem === "imperial";

  const [query, setQuery] = useState("");
  const results = useMemo(() => searchFoods(query), [query]);

  const [selectedFood, setSelectedFood] = useState<CommonFoodItem | null>(null);
  const [quantityInput, setQuantityInput] = useState(isImperial ? "3.5" : "100");
  const [adding, setAdding] = useState(false);

  const onQuickAdd = (term: string) => {
    setQuery(term);
  };

  const onSelectFood = (food: CommonFoodItem) => {
    setSelectedFood(food);
    setQuantityInput(isImperial ? "3.5" : "100");
  };

  const displayUnit = isImperial ? "oz" : "g";
  const parsedQuantity = parseFloat(quantityInput);
  const canonicalGrams =
    !isNaN(parsedQuantity) && parsedQuantity > 0
      ? convertQuantityToCanonical(parsedQuantity, displayUnit, "g")
      : 0;
  const preview =
    selectedFood && canonicalGrams > 0 ? scaleFood(selectedFood, canonicalGrams) : null;

  const onConfirmAdd = async () => {
    if (!selectedFood || canonicalGrams <= 0 || !preview) return;
    setAdding(true);
    try {
      const item: FoodItem = {
        id: `item_${Date.now()}`,
        name: selectedFood.name,
        quantity: Math.round(canonicalGrams),
        unit: "g",
        calories: preview.calories,
        proteinG: preview.proteinG,
        carbsG: preview.carbsG,
        fatG: preview.fatG,
        source: "database",
      };
      await addFoodItem(mealId, item);
      navigation.goBack();
    } catch {
      setAdding(false);
    }
  };

  if (selectedFood) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: spacing.lg }}>
          <Pressable onPress={() => setSelectedFood(null)} hitSlop={8}>
            <Text style={styles.backLink}>‹ Back to search</Text>
          </Pressable>
          <Text style={styles.title}>{selectedFood.name}</Text>

          <Text style={styles.fieldLabel}>Weight ({displayUnit})</Text>
          <TextInput
            value={quantityInput}
            onChangeText={setQuantityInput}
            keyboardType="decimal-pad"
            style={styles.input}
            autoFocus
          />

          {preview && (
            <Card style={{ marginTop: spacing.lg }}>
              <Text style={typography.h2}>{preview.calories} cal</Text>
              <View style={styles.macroRow}>
                <Text style={styles.macroText}>P {preview.proteinG}g</Text>
                <Text style={styles.macroText}>C {preview.carbsG}g</Text>
                <Text style={styles.macroText}>F {preview.fatG}g</Text>
              </View>
            </Card>
          )}

          <Button
            label="Add to meal"
            onPress={onConfirmAdd}
            loading={adding}
            disabled={canonicalGrams <= 0}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={styles.title}>Add ingredient</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a food..."
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoFocus
        />
      </View>

      {!query.trim() && (
        <View style={styles.quickAddSection}>
          <Text style={styles.fieldLabel}>Quick add</Text>
          <View style={styles.chipRow}>
            {QUICK_ADD.map((term) => (
              <Pressable key={term} onPress={() => onQuickAdd(term)} style={styles.chip}>
                <Text style={styles.chipText}>{term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {query.trim() && results.length === 0 && (
        <Text style={styles.emptyText}>No matches for "{query}"</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelectFood(item)} style={styles.resultRow}>
            <Text style={styles.resultName}>{item.name}</Text>
            <Text style={styles.resultSub}>
              {Math.round(item.caloriesPer100g)} cal/100g
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  backLink: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  quickAddSection: {
    paddingHorizontal: spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    ...typography.body,
    fontWeight: "600",
  },
  resultRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultName: {
    ...typography.body,
    fontWeight: "600",
  },
  resultSub: {
    ...typography.bodyMuted,
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  macroRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  macroText: {
    fontSize: 13,
    color: colors.textFaint,
    fontWeight: "600",
  },
});
