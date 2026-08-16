import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useMealStore } from "@/store/useMealStore";
import { scaleFoodItemToQuantity } from "@/domain/mealMath";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodItemEdit">;
type RouteProps = {
  params: { mealId: string; itemId: string };
};

// This screen is the direct fix for the #1 review complaint: users could
// previously only edit a whole meal's total grams. Here they can rename,
// requantify, swap to an alternative match, or delete a single ingredient
// without touching anything else on the plate.
export default function FoodItemEditScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as RouteProps;
  const { mealId, itemId } = route.params;

  const meal = useMealStore((s) => s.loggedMeals.find((m) => m.id === mealId));
  const updateFoodItem = useMealStore((s) => s.updateFoodItem);
  const removeFoodItem = useMealStore((s) => s.removeFoodItem);

  const item = meal?.items.find((i) => i.id === itemId);

  const [name, setName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? ""));
  const [calories, setCalories] = useState(String(item?.calories ?? ""));
  const [proteinG, setProteinG] = useState(String(item?.proteinG ?? ""));
  const [carbsG, setCarbsG] = useState(String(item?.carbsG ?? ""));
  const [fatG, setFatG] = useState(String(item?.fatG ?? ""));
  const [isSaving, setIsSaving] = useState(false);

  if (!item || !meal) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={typography.body}>This item is no longer available.</Text>
      </SafeAreaView>
    );
  }

  // Scales macros proportionally when the user changes quantity, using
  // the item's original per-unit values as the baseline. Delegates to the
  // shared, unit-tested scaleFoodItemToQuantity so this logic can't drift
  // from what the barcode-scan flow uses.
  const onQuantityChange = (value: string) => {
    setQuantity(value);
    const newQty = parseFloat(value);
    if (isNaN(newQty)) return;
    const scaled = scaleFoodItemToQuantity(item, newQty);
    setCalories(String(scaled.calories));
    setProteinG(String(scaled.proteinG));
    setCarbsG(String(scaled.carbsG));
    setFatG(String(scaled.fatG));
  };

  const onSwap = (alternativeName: string) => {
    setName(alternativeName);
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      await updateFoodItem(mealId, itemId, {
        name,
        quantity: parseFloat(quantity) || item.quantity,
        calories: parseFloat(calories) || 0,
        proteinG: parseFloat(proteinG) || 0,
        carbsG: parseFloat(carbsG) || 0,
        fatG: parseFloat(fatG) || 0,
      });
      navigation.goBack();
    } catch {
      Alert.alert(
        "Couldn't save changes",
        "Something went wrong updating this item. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async () => {
    try {
      await removeFoodItem(mealId, itemId);
      navigation.goBack();
    } catch {
      Alert.alert("Couldn't remove item", "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={typography.h1}>Edit item</Text>

        <Text style={styles.fieldLabel}>Food name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.fieldLabel}>Quantity ({item.unit})</Text>
        <TextInput
          value={quantity}
          onChangeText={onQuantityChange}
          keyboardType="decimal-pad"
          style={styles.input}
          testID="quantity-input"
        />

        <View style={styles.macroGrid}>
          <View style={styles.macroField}>
            <Text style={styles.fieldLabel}>Calories</Text>
            <TextInput
              value={calories}
              onChangeText={setCalories}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.macroField}>
            <Text style={styles.fieldLabel}>Protein (g)</Text>
            <TextInput
              value={proteinG}
              onChangeText={setProteinG}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>
        <View style={styles.macroGrid}>
          <View style={styles.macroField}>
            <Text style={styles.fieldLabel}>Carbs (g)</Text>
            <TextInput
              value={carbsG}
              onChangeText={setCarbsG}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.macroField}>
            <Text style={styles.fieldLabel}>Fat (g)</Text>
            <TextInput
              value={fatG}
              onChangeText={setFatG}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Not quite right? Swap the match</Text>
        <Card noPadding style={{ marginTop: spacing.xs }}>
          {getAlternatives(item.name).map((alt, idx) => (
            <View
              key={alt}
              style={[
                styles.altRow,
                idx === getAlternatives(item.name).length - 1 && {
                  borderBottomWidth: 0,
                },
              ]}
            >
              <Text style={typography.body}>{alt}</Text>
              <Button label="Use this" variant="ghost" onPress={() => onSwap(alt)} />
            </View>
          ))}
        </Card>

        <Button
          label="Save changes"
          onPress={onSave}
          loading={isSaving}
          style={{ marginTop: spacing.xl }}
          testID="save-changes-button"
        />
        <Button
          label="Remove this item"
          variant="ghost"
          onPress={onDelete}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// In the real integration this comes from item.alternativeMatches
// (populated by the recognition provider). Kept as a small helper here
// so the screen also works gracefully for manually-added items.
function getAlternatives(currentName: string): string[] {
  const commonSwaps: Record<string, string[]> = {
    "Grilled chicken breast": ["Grilled chicken thigh", "Roasted turkey breast"],
    "Steamed white rice": ["Brown rice", "Jasmine rice", "Quinoa"],
    "Steamed broccoli": ["Steamed green beans", "Roasted broccoli"],
    "Avocado toast": ["Whole grain toast with hummus"],
    "Fried egg": ["Poached egg", "Scrambled egg"],
    Cheeseburger: ["Turkey burger", "Veggie burger"],
    "French fries": ["Sweet potato fries", "Side salad"],
  };
  return commonSwaps[currentName] ?? [];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  macroGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  macroField: {
    flex: 1,
  },
  altRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
