import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from "victory-native";
import { format } from "date-fns";
import { useWeightStore } from "@/store/useWeightStore";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme/theme";

export default function WeightTrackingScreen() {
  const entries = useWeightStore((s) => s.entries);
  const addEntry = useWeightStore((s) => s.addEntry);
  const [input, setInput] = useState("");

  const onLog = () => {
    const value = parseFloat(input);
    if (isNaN(value) || value <= 0) return;
    addEntry(value);
    setInput("");
  };

  const chartData = entries.map((e) => ({
    x: new Date(e.loggedAt),
    y: e.weightKg,
  }));

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const trend =
    latest && first && entries.length > 1 ? latest.weightKg - first.weightKg : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={typography.h1}>Weight</Text>

        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.logRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Enter weight (kg)"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Button label="Log" onPress={onLog} disabled={!input} />
          </View>
        </Card>

        {entries.length > 0 && (
          <Card style={{ marginTop: spacing.md, alignItems: "center" }}>
            <Text style={styles.latestValue}>{latest.weightKg} kg</Text>
            <Text style={typography.bodyMuted}>
              {entries.length > 1
                ? `${trend >= 0 ? "+" : ""}${trend.toFixed(1)} kg since ${format(
                    new Date(first.loggedAt),
                    "MMM d"
                  )}`
                : "First entry logged"}
            </Text>
          </Card>
        )}

        {chartData.length > 1 ? (
          <Card style={{ marginTop: spacing.md }}>
            <VictoryChart
              theme={VictoryTheme.material}
              height={220}
              padding={{ left: 50, right: 20, top: 10, bottom: 40 }}
            >
              <VictoryAxis
                dependentAxis
                style={{ tickLabels: { fontSize: 11, fill: colors.textMuted } }}
              />
              <VictoryAxis
                tickFormat={(t) => format(new Date(t), "MMM d")}
                style={{
                  tickLabels: { fontSize: 10, fill: colors.textMuted, angle: -20 },
                }}
              />
              <VictoryLine
                data={chartData}
                style={{ data: { stroke: colors.accent, strokeWidth: 3 } }}
                interpolation="monotoneX"
              />
            </VictoryChart>
          </Card>
        ) : (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={typography.bodyMuted}>
              Log at least two entries to see your trend line.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  latestValue: {
    ...typography.display,
    fontSize: 36,
    color: colors.accentDark,
  },
});
