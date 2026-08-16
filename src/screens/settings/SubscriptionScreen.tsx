import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import {
  getSubscriptionStatus,
  openSubscriptionManagement,
  restorePurchases,
} from "@/services/revenuecat";
import { SubscriptionInfo } from "@/types";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { colors, spacing, typography } from "@/theme/theme";

// This screen exists specifically to fix "no clear/easy way to cancel" —
// it puts a one-tap deep link to native subscription management front
// and center, with no "contact us to cancel" dead end.
export default function SubscriptionScreen() {
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptionStatus()
      .then(setInfo)
      .finally(() => setLoading(false));
  }, []);

  const handleManage = async () => {
    setActionError(null);
    try {
      await openSubscriptionManagement();
    } catch {
      setActionError(
        "Couldn't open subscription settings. You can also manage your subscription directly from the App Store / Play Store app."
      );
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const restored = await restorePurchases();
      setInfo(restored);
    } catch {
      setActionError("Couldn't restore purchases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={typography.h1}>Subscription</Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            <Card style={{ marginTop: spacing.md }}>
              <Text style={typography.label}>Status</Text>
              <Text style={styles.statusValue}>{formatStatus(info?.status)}</Text>
              {info?.status === "trial" && info.trialEndsAt && (
                <Text style={typography.bodyMuted}>
                  Your free trial ends{" "}
                  {format(new Date(info.trialEndsAt), "MMMM d, yyyy")}. You won't be
                  charged before then.
                </Text>
              )}
              {info?.status === "active" && info.renewsAt && (
                <Text style={typography.bodyMuted}>
                  Renews {format(new Date(info.renewsAt), "MMMM d, yyyy")}
                </Text>
              )}
              {info?.status === "none" && (
                <Text style={typography.bodyMuted}>You're not currently subscribed.</Text>
              )}
            </Card>

            <Button
              label="Manage or cancel subscription"
              onPress={handleManage}
              style={{ marginTop: spacing.lg }}
            />
            <Text style={styles.helperText}>
              Opens your device's native subscription settings — cancel anytime, no need
              to contact us.
            </Text>

            <Button
              label="Restore purchases"
              variant="ghost"
              onPress={handleRestore}
              style={{ marginTop: spacing.md }}
            />

            {actionError && <Text style={styles.errorText}>{actionError}</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatStatus(status?: SubscriptionInfo["status"]) {
  switch (status) {
    case "trial":
      return "Free trial";
    case "active":
      return "Active";
    case "expired":
      return "Expired";
    default:
      return "Not subscribed";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusValue: {
    ...typography.h1,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  helperText: {
    ...typography.bodyMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
