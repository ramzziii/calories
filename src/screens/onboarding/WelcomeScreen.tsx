import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/navigation/types";
import Button from "@/components/Button";
import { colors, spacing, typography } from "@/theme/theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🍽️</Text>
        </View>
        <Text style={styles.title}>Plateful</Text>
        <Text style={styles.subtitle}>
          Snap a photo of your meal. We'll handle the calorie counting — right down to
          each ingredient on your plate.
        </Text>
      </View>
      <Button label="Get started" onPress={() => navigation.navigate("Goals")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  iconEmoji: {
    fontSize: 44,
  },
  title: {
    ...typography.display,
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMuted,
    textAlign: "center",
    fontSize: 17,
    maxWidth: 300,
  },
});
