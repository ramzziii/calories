import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useUserStore } from "@/store/useUserStore";
import { useUnitsStore } from "@/store/useUnitsStore";
import { useHealthSyncStore } from "@/store/useHealthSyncStore";
import { useAuthStore } from "@/store/useAuthStore";
import { isHealthSyncSupported } from "@/services/healthSync";
import { isCurrentlyPaid, daysLeftInTrial } from "@/domain/usageLimits";
import { UnitSystem } from "@/domain/unitConversion";
import Card from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme/theme";

const HEALTH_APP_NAME = Platform.OS === "ios" ? "Apple Health" : "Health Connect";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface RowProps {
  label: string;
  sublabel?: string;
  onPress: () => void;
}

function Row({ label, sublabel, onPress }: RowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useUserStore((s) => s.profile);
  const targets = useUserStore((s) => s.targets);
  const unitSystem = useUnitsStore((s) => s.system);
  const setUnitSystem = useUnitsStore((s) => s.setSystem);
  const healthSyncEnabled = useHealthSyncStore((s) => s.enabled);
  const setHealthSyncEnabled = useHealthSyncStore((s) => s.setEnabled);
  const healthSyncSupported = isHealthSyncSupported();
  const userEmail = useAuthStore((s) => s.user?.email);
  const trialStartedAt = useAuthStore((s) => s.trialStartedAt);
  const subscriptionStatus = useAuthStore((s) => s.subscriptionStatus);
  const subscriptionPeriodEnd = useAuthStore((s) => s.subscriptionPeriodEnd);
  const signOut = useAuthStore((s) => s.signOut);

  const isPaid = isCurrentlyPaid({
    trialStartedAt,
    subscriptionStatus,
    subscriptionPeriodEnd,
  });
  const planSublabel = isPaid
    ? "Premium — thanks for subscribing"
    : trialStartedAt
      ? `Free trial — ${daysLeftInTrial(trialStartedAt)} day${daysLeftInTrial(trialStartedAt) === 1 ? "" : "s"} left`
      : "Not signed in";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={typography.h1}>Settings</Text>

        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.unitRow}>
          {(["metric", "imperial"] as UnitSystem[]).map((option) => {
            const isSelected = unitSystem === option;
            return (
              <Pressable
                key={option}
                onPress={() => setUnitSystem(option)}
                style={[
                  styles.unitPill,
                  isSelected && styles.unitPillSelected,
                  { flex: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.unitPillText,
                    isSelected && { color: colors.accentDark },
                  ]}
                >
                  {option === "metric" ? "Metric (kg, cm)" : "Imperial (lb, ft/in)"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Health sync</Text>
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Sync to {HEALTH_APP_NAME}</Text>
              <Text style={styles.rowSublabel}>
                {healthSyncSupported
                  ? "Sends calories and macros for each logged meal."
                  : "Requires a full app build — not available in this preview."}
              </Text>
            </View>
            <Switch
              value={healthSyncEnabled}
              onValueChange={(value) => {
                setHealthSyncEnabled(value);
              }}
              disabled={!healthSyncSupported}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Your plan</Text>
        <Card noPadding>
          <Row
            label="Subscription"
            sublabel={planSublabel}
            onPress={() => navigation.navigate("Subscription")}
          />
        </Card>

        <Text style={styles.sectionTitle}>Account</Text>
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{userEmail ?? "Signed in"}</Text>
            </View>
            <Pressable onPress={() => signOut()}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Goals & targets</Text>
        <Card>
          <Text style={typography.body}>
            {targets ? `${targets.calories} cal/day target` : "Not set"}
          </Text>
          <Text style={typography.bodyMuted}>
            Goal: {profile?.goal ?? "—"} · Activity:{" "}
            {profile?.activityLevel?.replace("_", " ") ?? "—"}
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Support</Text>
        <Card noPadding>
          <Row
            label="Contact support"
            sublabel="Get a real reply from our team"
            onPress={() => navigation.navigate("Support")}
          />
          <View style={styles.divider} />
          <Row
            label="FAQ"
            sublabel="Common questions, answered"
            onPress={() => navigation.navigate("FAQ")}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  rowLabel: {
    ...typography.body,
    fontWeight: "600",
  },
  rowSublabel: {
    ...typography.bodyMuted,
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.textFaint,
  },
  signOutText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
  unitRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  unitPill: {
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
  },
  unitPillSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  unitPillText: {
    ...typography.body,
    fontWeight: "600",
    fontSize: 13,
  },
});
