import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format } from "date-fns";
import { RootStackParamList } from "@/navigation/types";
import { useUserStore } from "@/store/useUserStore";
import { useMealStore } from "@/store/useMealStore";
import ProgressRing from "@/components/ProgressRing";
import MacroBar from "@/components/MacroBar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const targets = useUserStore((s) => s.targets);
  const mealsForDate = useMealStore((s) => s.mealsForDate);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysMeals = mealsForDate(todayIso);

  const consumed = todaysMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totalCalories,
      proteinG: acc.proteinG + m.totalProteinG,
      carbsG: acc.carbsG + m.totalCarbsG,
      fatG: acc.fatG + m.totalFatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const remaining = Math.max(0, (targets?.calories ?? 0) - consumed.calories);
  const progress = targets?.calories ? consumed.calories / targets.calories : 0;

  // Simple streak: consecutive days (from today backward) with >=1 meal logged.
  const streak = calculateStreak(todaysMeals.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={typography.bodyMuted}>{format(new Date(), "EEEE, MMM d")}</Text>
            <Text style={styles.headerTitle}>Today</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          )}
        </View>

        <Card style={styles.ringCard}>
          <ProgressRing progress={progress} value={String(remaining)} label="cal left" />
          <View style={styles.macros}>
            <MacroBar
              label="Protein"
              currentG={consumed.proteinG}
              targetG={targets?.proteinG ?? 0}
              color={colors.protein}
            />
            <MacroBar
              label="Carbs"
              currentG={consumed.carbsG}
              targetG={targets?.carbsG ?? 0}
              color={colors.carbs}
            />
            <MacroBar
              label="Fat"
              currentG={consumed.fatG}
              targetG={targets?.fatG ?? 0}
              color={colors.fat}
            />
          </View>
        </Card>

        <View style={styles.ctaRow}>
          <Button
            label="📸  Log a meal"
            onPress={() => navigation.navigate("CameraCapture")}
            style={{ flex: 1 }}
            testID="log-meal-button"
          />
        </View>
        <View style={styles.secondaryRow}>
          <Button
            label="Scan barcode"
            variant="secondary"
            onPress={() => navigation.navigate("BarcodeScanner")}
            style={{ flex: 1 }}
          />
        </View>

        <Text style={styles.sectionTitle}>Today's meals</Text>
        {todaysMeals.length === 0 ? (
          <Card>
            <Text style={typography.bodyMuted}>
              Nothing logged yet — snap a photo of your next meal to get started.
            </Text>
          </Card>
        ) : (
          todaysMeals.map((meal) => (
            <Card key={meal.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.mealRow}>
                <Text style={styles.mealType}>
                  {meal.mealType[0].toUpperCase() + meal.mealType.slice(1)}
                </Text>
                <Text style={styles.mealCalories}>
                  {Math.round(meal.totalCalories)} cal
                </Text>
              </View>
              <Text style={typography.bodyMuted} numberOfLines={1}>
                {meal.items.map((i) => i.name).join(", ")}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Placeholder streak logic — a real implementation would check
// consecutive prior days in loggedMeals history.
function calculateStreak(loggedToday: boolean): number {
  return loggedToday ? 1 : 0;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
  },
  streakBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  streakText: {
    fontWeight: "700",
    color: colors.accentDark,
  },
  ringCard: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  macros: {
    width: "100%",
    marginTop: spacing.lg,
  },
  ctaRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryRow: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  mealRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mealType: {
    fontWeight: "700",
    color: colors.text,
  },
  mealCalories: {
    fontWeight: "700",
    color: colors.accentDark,
  },
});
