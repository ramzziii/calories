import React, { useState } from "react";
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useMealStore } from "@/store/useMealStore";
import { useUnitsStore } from "@/store/useUnitsStore";
import { scaleFoodItemToQuantity } from "@/domain/mealMath";
import {
  convertQuantityForDisplay,
  convertQuantityToCanonical,
} from "@/domain/unitConversion";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodItemEdit">;
type RouteProps = {
  params: { mealId: string; itemId: string };
};

const numericInputAccessoryViewID = "food-item-numeric-done";

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
  const unitSystem = useUnitsStore((s) => s.system);

  const item = meal?.items.find((i) => i.id === itemId);

  // The item's quantity is always stored canonically (e.g. grams) — this
  // is only the unit it's displayed/edited in, which may differ (oz) if
  // the user is on imperial. Converted back to canonical on save.
  const displayQuantity = item
    ? convertQuantityForDisplay(item.quantity, item.unit, unitSystem)
    : { value: 0, unit: "g" };

  const [name, setName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState(String(displayQuantity.value || ""));
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
    const typed = parseFloat(value);
    if (isNaN(typed)) return;
    const canonicalQty = convertQuantityToCanonical(
      typed,
      displayQuantity.unit,
      item.unit
    );
    const scaled = scaleFoodItemToQuantity(item, canonicalQty);
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
      const typedQuantity = parseFloat(quantity);
      const canonicalQuantity = isNaN(typedQuantity)
        ? item.quantity
        : convertQuantityToCanonical(typedQuantity, displayQuantity.unit, item.unit);
      await updateFoodItem(mealId, itemId, {
        name,
        quantity: canonicalQuantity,
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={typography.h1}>Edit item</Text>

          <Text style={styles.fieldLabel}>Food name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor={colors.textFaint}
          />

          <Text style={styles.fieldLabel}>Quantity ({displayQuantity.unit})</Text>
          <TextInput
            value={quantity}
            onChangeText={onQuantityChange}
            keyboardType="decimal-pad"
            style={styles.input}
            testID="quantity-input"
            inputAccessoryViewID={
              Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
            }
          />

          <View style={styles.macroGrid}>
            <View style={styles.macroField}>
              <Text style={styles.fieldLabel}>Calories</Text>
              <TextInput
                value={calories}
                onChangeText={setCalories}
                keyboardType="decimal-pad"
                style={styles.input}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                }
              />
            </View>
            <View style={styles.macroField}>
              <Text style={styles.fieldLabel}>Protein (g)</Text>
              <TextInput
                value={proteinG}
                onChangeText={setProteinG}
                keyboardType="decimal-pad"
                style={styles.input}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                }
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
                inputAccessoryViewID={
                  Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                }
              />
            </View>
            <View style={styles.macroField}>
              <Text style={styles.fieldLabel}>Fat (g)</Text>
              <TextInput
                value={fatG}
                onChangeText={setFatG}
                keyboardType="decimal-pad"
                style={styles.input}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                }
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

        {Platform.OS === "ios" && (
          <InputAccessoryView nativeID={numericInputAccessoryViewID}>
            <View style={styles.accessoryBar}>
              <Pressable onPress={() => Keyboard.dismiss()} hitSlop={8}>
                <Text style={styles.accessoryDoneText}>Done</Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: colors.backgroundAlt,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  accessoryDoneText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "700",
  },
});
