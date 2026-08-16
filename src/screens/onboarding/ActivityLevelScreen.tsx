import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/navigation/types";
import { ActivityLevel } from "@/types";
import { ACTIVITY_LEVEL_OPTIONS } from "@/constants/activityLevels";
import Button from "@/components/Button";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ActivityLevel">;

export default function ActivityLevelScreen({ navigation }: Props) {
  const update = useOnboardingStore((s) => s.update);
  const [selected, setSelected] = useState<ActivityLevel | null>(null);

  const onContinue = () => {
    if (!selected) return;
    update({ activityLevel: selected });
    navigation.navigate("Summary");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={typography.label}>Step 3 of 4</Text>
        <Text style={styles.title}>How active are you?</Text>
        <View style={{ marginTop: spacing.lg }}>
          {ACTIVITY_LEVEL_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setSelected(option.value)}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <Text
                  style={[styles.optionLabel, isSelected && { color: colors.accentDark }]}
                >
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
  optionLabel: {
    ...typography.h2,
    fontSize: 17,
  },
  optionDescription: {
    ...typography.bodyMuted,
    marginTop: 2,
  },
});
