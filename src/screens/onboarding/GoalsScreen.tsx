import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/navigation/types";
import { GoalType } from "@/types";
import Button from "@/components/Button";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Goals">;

const GOALS: { value: GoalType; label: string; emoji: string }[] = [
  { value: "lose", label: "Lose weight", emoji: "📉" },
  { value: "maintain", label: "Maintain weight", emoji: "⚖️" },
  { value: "gain", label: "Gain weight", emoji: "📈" },
];

export default function GoalsScreen({ navigation }: Props) {
  const update = useOnboardingStore((s) => s.update);
  const [selected, setSelected] = useState<GoalType | null>(null);

  const onContinue = () => {
    if (!selected) return;
    update({ goal: selected });
    navigation.navigate("Stats");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={typography.label}>Step 1 of 4</Text>
        <Text style={styles.title}>What's your goal?</Text>
        <View style={{ marginTop: spacing.lg }}>
          {GOALS.map((goal) => {
            const isSelected = selected === goal.value;
            return (
              <Pressable
                key={goal.value}
                onPress={() => setSelected(goal.value)}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <Text style={styles.emoji}>{goal.emoji}</Text>
                <Text
                  style={[styles.optionLabel, isSelected && { color: colors.accentDark }]}
                >
                  {goal.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Button label="Continue" onPress={onContinue} disabled={!selected} />
    </SafeAreaView>
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
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  emoji: {
    fontSize: 26,
    marginRight: spacing.md,
  },
  optionLabel: {
    ...typography.h2,
  },
});
