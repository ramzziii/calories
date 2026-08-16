import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { getCurrentOffering, purchasePackage } from "@/services/revenuecat";
import Button from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Paywall">;

// Local plan descriptions used until real RevenueCat offerings are wired
// up — the point is that trial length + exact post-trial price are
// ALWAYS shown before purchase, addressing "no clear/easy way" and
// "surprise charges" complaints.
const PLAN_OPTIONS = [
  {
    id: "yumtrack_annual",
    label: "Annual",
    trialDays: 7,
    priceAfterTrial: "$39.99/year",
    perMonthEquivalent: "≈ $3.33/mo",
    badge: "Best value",
  },
  {
    id: "yumtrack_monthly",
    label: "Monthly",
    trialDays: 3,
    priceAfterTrial: "$6.99/month",
    perMonthEquivalent: null,
    badge: null,
  },
];

export default function PaywallScreen() {
  const navigation = useNavigation<Nav>();
  const [selectedId, setSelectedId] = useState(PLAN_OPTIONS[0].id);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offeringsAvailable, setOfferingsAvailable] = useState(false);

  useEffect(() => {
    getCurrentOffering().then((offering) => {
      setOfferingsAvailable(!!offering);
    });
  }, []);

  const selectedPlan = PLAN_OPTIONS.find((p) => p.id === selectedId)!;

  const handleStartTrial = async () => {
    setPurchasing(true);
    setError(null);
    try {
      if (offeringsAvailable) {
        await purchasePackage(selectedId);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(
        err?.message ??
          "Purchase couldn't be completed. RevenueCat isn't fully configured yet — add your API keys in services/revenuecat.ts."
      );
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={typography.h1}>Unlock YumTrack Premium</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>
          Unlimited photo scans, barcode lookups, and full history — try it free, cancel
          anytime.
        </Text>

        <View style={{ marginTop: spacing.lg }}>
          {PLAN_OPTIONS.map((plan) => {
            const isSelected = plan.id === selectedId;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedId(plan.id)}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planLabel}>{plan.label}</Text>
                    {plan.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={typography.bodyMuted}>
                    {plan.trialDays}-day free trial, then {plan.priceAfterTrial}
                    {plan.perMonthEquivalent ? ` (${plan.perMonthEquivalent})` : ""}
                  </Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.termsBox}>
          <Text style={styles.termsText}>
            You won't be charged today. Your {selectedPlan.trialDays}-day free trial
            starts now; after that you'll be charged {selectedPlan.priceAfterTrial} unless
            you cancel first. Manage or cancel anytime from Settings → Subscription.
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          label={
            purchasing
              ? "Starting trial..."
              : `Start ${selectedPlan.trialDays}-day free trial`
          }
          onPress={handleStartTrial}
          loading={purchasing}
          style={{ marginTop: spacing.lg }}
        />
        <Button
          label="Not now"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  planLabel: {
    ...typography.h2,
    fontSize: 17,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textOnAccent,
    textTransform: "uppercase",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  termsBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.md,
  },
  termsText: {
    ...typography.bodyMuted,
    fontSize: 13,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
