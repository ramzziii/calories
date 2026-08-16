import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/Card";
import { colors, spacing, typography } from "@/theme/theme";

const FAQ_ITEMS = [
  {
    q: "How accurate is the calorie estimate?",
    a: "Photo estimates are a starting point, generally within a reasonable range for common foods. You can tap any detected item to correct the quantity, swap the match, or fine-tune the numbers — and we remember your corrections.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Settings → Subscription → Manage or cancel subscription. This opens your device's native App Store or Play Store subscription page directly — no need to email us.",
  },
  {
    q: "Will I be charged when my free trial ends?",
    a: "Yes, unless you cancel before the trial period ends. You'll always see the exact trial length and post-trial price before starting a trial.",
  },
  {
    q: "Can I log packaged or branded foods?",
    a: "Yes — use the barcode scanner from the home screen. It looks up packaged foods using the Open Food Facts database.",
  },
  {
    q: "Can I save a meal I eat often?",
    a: 'Yes. After scanning a meal, choose "Save as a custom meal." You can log it again anytime from the Custom Meals tab, in one tap.',
  },
  {
    q: "What if a food item is completely wrong?",
    a: "Tap the item, then either edit its details directly or choose one of the suggested alternative matches. You can also remove just that item without affecting the rest of the meal.",
  },
];

export default function FAQScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={typography.h1}>FAQ</Text>

        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Pressable key={item.q} onPress={() => setOpenIndex(isOpen ? null : idx)}>
              <Card style={{ marginTop: spacing.sm }}>
                <View style={styles.qRow}>
                  <Text style={styles.question}>{item.q}</Text>
                  <Text style={styles.chevron}>{isOpen ? "−" : "+"}</Text>
                </View>
                {isOpen && <Text style={styles.answer}>{item.a}</Text>}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  qRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  question: {
    ...typography.body,
    fontWeight: "600",
    flex: 1,
    paddingRight: spacing.sm,
  },
  chevron: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: "700",
  },
  answer: {
    ...typography.bodyMuted,
    marginTop: spacing.sm,
  },
});
