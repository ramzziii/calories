import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/navigation/types";
import { Sex } from "@/types";
import Button from "@/components/Button";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Stats">;

export default function StatsScreen({ navigation }: Props) {
  const update = useOnboardingStore((s) => s.update);
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const isValid = sex && Number(age) > 0 && Number(heightCm) > 0 && Number(weightKg) > 0;

  const onContinue = () => {
    if (!isValid) return;
    update({
      sex: sex!,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
    });
    navigation.navigate("ActivityLevel");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1 }}>
          <Text style={typography.label}>Step 2 of 4</Text>
          <Text style={styles.title}>Tell us about you</Text>

          <Text style={styles.fieldLabel}>Sex</Text>
          <View style={styles.row}>
            {(["female", "male"] as Sex[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setSex(option)}
                style={[styles.pill, sex === option && styles.pillSelected, { flex: 1 }]}
              >
                <Text
                  style={[
                    styles.pillText,
                    sex === option && { color: colors.accentDark },
                  ]}
                >
                  {option === "female" ? "Female" : "Male"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Age</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="e.g. 29"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Height (cm)</Text>
          <TextInput
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="number-pad"
            placeholder="e.g. 170"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Weight (kg)</Text>
          <TextInput
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
            placeholder="e.g. 68"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
        </View>
        <Button label="Continue" onPress={onContinue} disabled={!isValid} />
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pill: {
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
  },
  pillSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  pillText: {
    ...typography.body,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
});
