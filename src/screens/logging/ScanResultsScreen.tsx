import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { recognizeFood } from "@/services/foodRecognition";
import { FoodItem, LoggedMeal, RecognizedFoodItem } from "@/types";
import { useMealStore } from "@/store/useMealStore";
import { inferMealTypeFromHour, sumFoodItems } from "@/domain/mealMath";
import FoodItemCard from "@/components/FoodItemCard";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ScanResults">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function recognizedToFoodItem(r: RecognizedFoodItem, idx: number): FoodItem {
  return {
    id: `item_${Date.now()}_${idx}`,
    name: r.name,
    quantity: r.estimatedQuantity,
    unit: r.unit,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    source: "ai_vision",
  };
}

export default function ScanResultsScreen({ route }: Props) {
  const { imageUri } = route.params;
  const navigation = useNavigation<Nav>();
  const addLoggedMeal = useMealStore((s) => s.addLoggedMeal);
  const removeFoodItem = useMealStore((s) => s.removeFoodItem);
  const loggedMeals = useMealStore((s) => s.loggedMeals);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealId, setMealId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    recognizeFood(imageUri)
      .then(async (result) => {
        if (cancelled) return;
        const items = result.items.map(recognizedToFoodItem);
        const meal: LoggedMeal = {
          id: `meal_${Date.now()}`,
          userId: "local",
          loggedAt: new Date().toISOString(),
          mealType: inferMealTypeFromHour(new Date().getHours()),
          photoUri: imageUri,
          items,
          ...sumFoodItems(items),
        };
        try {
          await addLoggedMeal(meal);
          if (!cancelled) setMealId(meal.id);
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Couldn't save this meal. Please try again."
            );
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [imageUri]);

  const meal = loggedMeals.find((m) => m.id === mealId);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <Image source={{ uri: imageUri }} style={styles.loadingImage} />
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
        <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
          Analyzing your plate...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !meal) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorEmoji}>🤔</Text>
        <Text style={typography.h2}>Couldn't read that photo</Text>
        <Text
          style={[typography.bodyMuted, { textAlign: "center", marginTop: spacing.sm }]}
        >
          {error ?? "Please try again."}
        </Text>
        <Button
          label="Try again"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.lg }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={{ uri: imageUri }} style={styles.heroImage} />

        <View style={styles.content}>
          <Text style={typography.h1}>{Math.round(meal.totalCalories)} cal</Text>
          <Text style={typography.bodyMuted}>
            {meal.items.length} item{meal.items.length !== 1 ? "s" : ""} detected — tap
            any item to fine-tune it.
          </Text>

          <Card style={{ marginTop: spacing.md }} noPadding>
            <View style={styles.cardInner}>
              {meal.items.map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    navigation.navigate("FoodItemEdit", {
                      mealId: meal.id,
                      itemId: item.id,
                    })
                  }
                  onDelete={() => {
                    removeFoodItem(meal.id, item.id).catch(() => {
                      Alert.alert("Couldn't remove item", "Please try again.");
                    });
                  }}
                />
              ))}
              {meal.items.length === 0 && (
                <Text style={[typography.bodyMuted, { padding: spacing.md }]}>
                  All items removed. Add this meal manually or retake the photo.
                </Text>
              )}
            </View>
          </Card>

          <View style={styles.actions}>
            <Button
              label="Save meal to log"
              onPress={() => navigation.navigate("Main" as never)}
            />
            <Button
              label="Save as a custom meal for next time"
              variant="secondary"
              onPress={() =>
                navigation.navigate("SaveMeal", {
                  items: JSON.stringify(meal.items),
                })
              }
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingImage: {
    width: 220,
    height: 220,
    borderRadius: radii.lg,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroImage: {
    width: "100%",
    height: 260,
  },
  content: {
    padding: spacing.lg,
  },
  cardInner: {
    paddingHorizontal: spacing.md,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
