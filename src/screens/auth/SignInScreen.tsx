import React from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/useAuthStore";
import Button from "@/components/Button";
import { colors, spacing, typography } from "@/theme/theme";

export default function SignInScreen() {
  const isSigningIn = useAuthStore((s) => s.isSigningIn);
  const error = useAuthStore((s) => s.error);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const clearError = useAuthStore((s) => s.clearError);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🍽️</Text>
        </View>
        <Text style={styles.title}>YumTrack</Text>
        <Text style={styles.subtitle}>
          Snap a photo of your meal and get calories and macros in seconds. Sign in to
          start your free 7-day trial.
        </Text>
      </View>

      <View style={styles.buttons}>
        {isSigningIn && (
          <ActivityIndicator style={{ marginBottom: spacing.md }} color={colors.accent} />
        )}

        {error && (
          <Text style={styles.errorText} onPress={clearError}>
            {error}
          </Text>
        )}

        {Platform.OS === "ios" && (
          <Button
            label="Continue with Apple"
            onPress={signInWithApple}
            disabled={isSigningIn}
            style={{ backgroundColor: "#000", marginBottom: spacing.sm }}
          />
        )}
        <Button
          label="Continue with Google"
          onPress={signInWithGoogle}
          disabled={isSigningIn}
          variant="secondary"
        />

        <Text style={styles.termsText}>
          By continuing, you agree that your free trial starts now. No charge until it
          ends, and you can cancel anytime.
        </Text>
      </View>
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
    maxWidth: 320,
  },
  buttons: {
    paddingBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  termsText: {
    ...typography.bodyMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
