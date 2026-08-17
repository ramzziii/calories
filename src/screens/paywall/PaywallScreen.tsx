import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { getCurrentOffering, purchasePackage } from "@/services/revenuecat";
import { useAuthStore } from "@/store/useAuthStore";
import { daysLeftInTrial, isCurrentlyPaid, isTrialExpired } from "@/domain/usageLimits";
import Button from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Paywall">;
type Route = RouteProp<RootStackParamList, "Paywall">;

// Local plan descriptions used until real RevenueCat offerings are wired
// up. The free trial is account-wide (7 days from sign-up, tracked
// server-side — see useAuthStore/usageLimits), not a per-product store
// trial, so every plan here bills immediately at the price shown the
// moment it's purchased. That's stated plainly below rather than
// implying a second trial the store would actually charge for.
// IDs match RevenueCat's default package identifiers for a standard
// Weekly/Monthly/Annual offering ($rc_weekly etc.) — if you set up your
// RevenueCat offering with custom package identifiers instead, update
// these three ids to match.
const PLAN_OPTIONS = [
  { id: "$rc_weekly", label: "Weekly", price: "$2.99", cadence: "/week", badge: null },
  {
    id: "$rc_monthly",
    label: "Monthly",
    price: "$9.99",
    cadence: "/month",
    badge: "Popular",
  },
  {
    id: "$rc_annual",
    label: "Yearly",
    price: "$99.99",
    cadence: "/year",
    badge: "Best value",
  },
];

export default function PaywallScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const context = route.params?.context;
  const [selectedId, setSelectedId] = useState(PLAN_OPTIONS[1].id);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offeringsAvailable, setOfferingsAvailable] = useState(false);

  const trialStartedAt = useAuthStore((s) => s.trialStartedAt);
  const subscriptionStatus = useAuthStore((s) => s.subscriptionStatus);
  const subscriptionPeriodEnd = useAuthStore((s) => s.subscriptionPeriodEnd);
  const alreadyPaid = isCurrentlyPaid({
    trialStartedAt,
    subscriptionStatus,
    subscriptionPeriodEnd,
  });
  const trialExpired = trialStartedAt ? isTrialExpired(trialStartedAt) : false;

  useEffect(() => {
    getCurrentOffering().then((offering) => {
      setOfferingsAvailable(!!offering);
    });
  }, []);

  const selectedPlan = PLAN_OPTIONS.find((p) => p.id === selectedId)!;

  const handleSubscribe = async () => {
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
          "Purchase couldn't be completed. RevenueCat isn't fully configured yet — see AUTH_BILLING_SETUP.md."
      );
    } finally {
      setPurchasing(false);
    }
  };

  const bannerText = alreadyPaid
    ? "You're already a premium subscriber."
    : context === "daily_limit"
      ? "You've used today's free scans. Subscribe for a higher daily limit."
      : context === "trial_expired" || trialExpired
        ? "Your 7-day free trial has ended. Subscribe to keep logging meals."
        : trialStartedAt
          ? `${daysLeftInTrial(trialStartedAt)} day${daysLeftInTrial(trialStartedAt) === 1 ? "" : "s"} left in your free trial.`
          : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={typography.h1}>Unlock YumTrack Premium</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>
          50 meal scans a day, unlimited barcode lookups, and full history.
        </Text>

        {bannerText && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{bannerText}</Text>
          </View>
        )}

        <View style={styles.trustRow}>
          <Text style={styles.trustLine}>✓ See your price before you pay</Text>
          <Text style={styles.trustLine}>✓ Cancel in one tap — no emails, no hoops</Text>
        </View>

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
                    {plan.price}
                    {plan.cadence}
                  </Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.termsBox}>
          <Text style={styles.termsText}>
            Billing starts immediately at {selectedPlan.price}
            {selectedPlan.cadence} — this purchase itself has no separate free trial.
            Cancel anytime from Settings → Subscription; you'll keep access until the end
            of the period you already paid for.
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!alreadyPaid && (
          <Button
            label={
              purchasing
                ? "Processing..."
                : `Subscribe — ${selectedPlan.price}${selectedPlan.cadence}`
            }
            onPress={handleSubscribe}
            loading={purchasing}
            style={{ marginTop: spacing.lg }}
          />
        )}
        <Button
          label={alreadyPaid ? "Done" : "Not now"}
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
  banner: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
  },
  bannerText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.accentDark,
    textAlign: "center",
  },
  trustRow: {
    marginTop: spacing.md,
    gap: 4,
  },
  trustLine: {
    ...typography.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.success,
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
