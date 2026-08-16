import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/navigation/types";
import { calculateDailyTargets } from "@/services/nutritionCalculator";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useUserStore } from "@/store/useUserStore";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { colors, spacing, typography } from "@/theme/theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Summary">;

export default function SummaryScreen(_props: Props) {
  const draft = useOnboardingStore((s) => s.draft);
  const resetDraft = useOnboardingStore((s) => s.reset);
  const setProfile = useUserStore((s) => s.setProfile);

  const targets = useMemo(() => {
    if (
      !draft.sex ||
      !draft.weightKg ||
      !draft.heightCm ||
      !draft.age ||
      !draft.activityLevel ||
      !draft.goal
    ) {
      return null;
    }
    return calculateDailyTargets({
      sex: draft.sex,
      weightKg: draft.weightKg,
      heightCm: draft.heightCm,
      age: draft.age,
      activityLevel: draft.activityLevel,
      goal: draft.goal,
    });
  }, [draft]);

  const onFinish = () => {
    if (
      !draft.sex ||
      !draft.weightKg ||
      !draft.heightCm ||
      !draft.age ||
      !draft.activityLevel ||
      !draft.goal
    ) {
      return;
    }
    setProfile({
      id: `local_${Date.now()}`,
      sex: draft.sex,
      age: draft.age,
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
      goal: draft.goal,
      activityLevel: draft.activityLevel,
      onboardingComplete: true,
    });
    resetDraft();
    // RootNavigator watches profile.onboardingComplete and will
    // automatically switch to the Main tab navigator.
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={typography.label}>Step 4 of 4</Text>
        <Text style={styles.title}>Your daily targets</Text>
        <Text style={styles.subtitle}>
          Based on your goal, stats, and activity level. You can fine-tune these anytime
          in Settings.
        </Text>

        {targets && (
          <Card style={{ marginTop: spacing.lg }}>
            <View style={styles.calorieRow}>
              <Text style={styles.calorieValue}>{targets.calories}</Text>
              <Text style={styles.calorieUnit}>calories / day</Text>
            </View>
            <View style={styles.macroGrid}>
              <MacroPill
                label="Protein"
                value={targets.proteinG}
                color={colors.protein}
              />
              <MacroPill label="Carbs" value={targets.carbsG} color={colors.carbs} />
              <MacroPill label="Fat" value={targets.fatG} color={colors.fat} />
            </View>
          </Card>
        )}
      </View>
      <Button label="Start using YumTrack" onPress={onFinish} />
    </SafeAreaView>
  );
}

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.macroPill}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{value}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
  },
  calorieRow: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  calorieValue: {
    ...typography.display,
    fontSize: 48,
    color: colors.accentDark,
  },
  calorieUnit: {
    ...typography.bodyMuted,
  },
  macroGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  macroPill: {
    alignItems: "center",
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.xs,
  },
  macroValue: {
    ...typography.h2,
    fontSize: 18,
  },
  macroLabel: {
    ...typography.bodyMuted,
    fontSize: 12,
  },
});
