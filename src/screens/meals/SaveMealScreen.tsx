import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useMealStore } from "@/store/useMealStore";
import { FoodItem } from "@/types";
import Button from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "SaveMeal">;
type RouteProps = { params: { items: string } };

// Addresses the "no way to save/reuse custom meals" complaint —
// lets users name a logged meal and reuse it instantly next time.
export default function SaveMealScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as RouteProps;
  const items: FoodItem[] = JSON.parse(route.params.items);
  const saveAsCustomMeal = useMealStore((s) => s.saveAsCustomMeal);

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const totalCalories = items.reduce((sum, i) => sum + i.calories, 0);

  const onSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await saveAsCustomMeal(name.trim(), items);
      navigation.navigate("Main" as never);
    } catch {
      Alert.alert("Couldn't save this meal", "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={typography.h1}>Save this meal</Text>
      <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>
        Give it a name so you can log it again in one tap — no rescanning needed.
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. My usual breakfast"
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        autoFocus
      />

      <View style={styles.summary}>
        <Text style={typography.bodyMuted}>
          {items.length} item{items.length !== 1 ? "s" : ""} · {Math.round(totalCalories)}{" "}
          cal
        </Text>
      </View>

      <Button
        label="Save custom meal"
        onPress={onSave}
        disabled={!name.trim()}
        loading={isSaving}
        style={{ marginTop: spacing.xl }}
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
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.lg,
  },
  summary: {
    marginTop: spacing.md,
  },
});
