import React, { useState } from "react";
import {
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/navigation/types";
import { Sex } from "@/types";
import Button from "@/components/Button";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useUnitsStore } from "@/store/useUnitsStore";
import { feetInchesToCm, lbToKg } from "@/domain/unitConversion";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Stats">;

const numericInputAccessoryViewID = "stats-numeric-done";

export default function StatsScreen({ navigation }: Props) {
  const update = useOnboardingStore((s) => s.update);
  const isImperial = useUnitsStore((s) => s.system === "imperial");

  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState("");

  // Metric inputs
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Imperial inputs — internally still converted to canonical cm/kg
  // before being stored, so nothing downstream (targets math, profile)
  // needs to know which unit system the user entered values in.
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightLb, setWeightLb] = useState("");

  const resolvedHeightCm = isImperial
    ? heightFeet !== "" && heightInches !== ""
      ? feetInchesToCm(Number(heightFeet), Number(heightInches))
      : 0
    : Number(heightCm);
  const resolvedWeightKg = isImperial
    ? weightLb !== ""
      ? lbToKg(Number(weightLb))
      : 0
    : Number(weightKg);

  const isValid = sex && Number(age) > 0 && resolvedHeightCm > 0 && resolvedWeightKg > 0;

  const onContinue = () => {
    if (!isValid) return;
    update({
      sex: sex!,
      age: Number(age),
      heightCm: resolvedHeightCm,
      weightKg: resolvedWeightKg,
    });
    navigation.navigate("ActivityLevel");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            inputAccessoryViewID={
              Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
            }
          />

          {isImperial ? (
            <>
              <Text style={styles.fieldLabel}>Height</Text>
              <View style={styles.row}>
                <TextInput
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                  keyboardType="number-pad"
                  placeholder="ft"
                  placeholderTextColor={colors.textFaint}
                  style={[styles.input, { flex: 1 }]}
                  inputAccessoryViewID={
                    Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                  }
                />
                <TextInput
                  value={heightInches}
                  onChangeText={setHeightInches}
                  keyboardType="number-pad"
                  placeholder="in"
                  placeholderTextColor={colors.textFaint}
                  style={[styles.input, { flex: 1 }]}
                  inputAccessoryViewID={
                    Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                  }
                />
              </View>

              <Text style={styles.fieldLabel}>Weight (lb)</Text>
              <TextInput
                value={weightLb}
                onChangeText={setWeightLb}
                keyboardType="decimal-pad"
                placeholder="e.g. 150"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                }
              />
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Height (cm)</Text>
              <TextInput
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="number-pad"
                placeholder="e.g. 170"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                }
              />

              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="e.g. 68"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? numericInputAccessoryViewID : undefined
                }
              />
            </>
          )}
        </ScrollView>
        <Button label="Continue" onPress={onContinue} disabled={!isValid} />

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
