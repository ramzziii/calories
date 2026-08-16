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
import { recognizeFood, recognizeFoodFromText } from "@/services/foodRecognition";
import { FoodItem, LoggedMeal, RecognizedFoodItem } from "@/types";
import { useMealStore } from "@/store/useMealStore";
import { useFoodCorrectionsStore } from "@/store/useFoodCorrectionsStore";
import { inferMealTypeFromHour, sumFoodItems } from "@/domain/mealMath";
import FoodItemCard from "@/components/FoodItemCard";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ScanResults">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

// If the user has previously corrected this same food (by name), start
// from what they confirmed instead of the AI's raw first guess — see
// useFoodCorrectionsStore for why.
function recognizedToFoodItem(r: RecognizedFoodItem, idx: number): FoodItem {
  const correction = useFoodCorrectionsStore.getState().getCorrection(r.name);
  const base = {
    id: `item_${Date.now()}_${idx}`,
    name: r.name,
    source: "ai_vision" as const,
  };

  if (correction) {
    return {
      ...base,
      quantity: correction.quantity,
      unit: correction.unit,
      calories: correction.calories,
      proteinG: correction.proteinG,
      carbsG: correction.carbsG,
      fatG: correction.fatG,
      fiberG: correction.fiberG,
      sugarG: correction.sugarG,
      sodiumMg: correction.sodiumMg,
      userCorrected: true,
    };
  }

  return {
    ...base,
    quantity: r.estimatedQuantity,
    unit: r.unit,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    fiberG: r.fiberG,
    sugarG: r.sugarG,
    sodiumMg: r.sodiumMg,
  };
}

export default function ScanResultsScreen({ route }: Props) {
  const imageUri = "imageUri" in route.params ? route.params.imageUri : undefined;
  const textDescription =
    "textDescription" in route.params ? route.params.textDescription : undefined;
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

    const recognition = imageUri
      ? recognizeFood(imageUri)
      : recognizeFoodFromText(textDescription!);

    recognition
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
  }, [imageUri, textDescription]);

  const meal = loggedMeals.find((m) => m.id === mealId);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.loadingImage} />
        ) : (
          <Text style={styles.errorEmoji}>✏️</Text>
        )}
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
        <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
          {imageUri ? "Analyzing your plate..." : "Reading your description..."}
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !meal) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorEmoji}>🤔</Text>
        <Text style={typography.h2}>
          {imageUri ? "Couldn't read that photo" : "Couldn't read that description"}
        </Text>
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
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.heroImage} />
        ) : (
          <View style={styles.textHero}>
            <Text style={typography.label}>You described</Text>
            <Text style={styles.textHeroBody}>"{textDescription}"</Text>
          </View>
        )}

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

          <Button
            label="+ Add ingredient"
            variant="secondary"
            onPress={() => navigation.navigate("AddIngredient", { mealId: meal.id })}
            style={{ marginTop: spacing.sm }}
          />

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
  textHero: {
    backgroundColor: colors.backgroundAlt,
    padding: spacing.lg,
  },
  textHeroBody: {
    ...typography.h2,
    fontSize: 18,
    fontStyle: "italic",
    marginTop: spacing.xs,
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
