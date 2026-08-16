import React, { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme/theme";

const SUPPORT_EMAIL = "support@yumtrack-app.com";

// Fixes "no in-app customer support channel at all." At minimum this is
// a working mailto link; the message field pre-fills the email body so
// the user doesn't start from a blank page.
export default function SupportScreen() {
  const [message, setMessage] = useState("");

  const openMail = () => {
    const body = encodeURIComponent(message || "Hi YumTrack team, I need help with...");
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=YumTrack%20Support&body=${body}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={typography.h1}>Contact support</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>
          We read every message — a real person will reply, usually within one business
          day.
        </Text>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={typography.label}>What's going on?</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            placeholder="Describe your issue..."
            placeholderTextColor={colors.textFaint}
            style={styles.textArea}
          />
        </Card>

        <Button
          label="Email support"
          onPress={openMail}
          style={{ marginTop: spacing.lg }}
        />
        <Text style={styles.emailText}>{SUPPORT_EMAIL}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  textArea: {
    marginTop: spacing.sm,
    minHeight: 120,
    textAlignVertical: "top",
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  emailText: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
