import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import Button from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "DescribeMeal">;

// Fallback for when a photo isn't practical — same recognition pipeline
// as CameraCaptureScreen, just fed a typed (or dictated, via the
// keyboard's built-in mic) description instead of an image.
export default function DescribeMealScreen() {
  const navigation = useNavigation<Nav>();
  const [description, setDescription] = useState("");

  const onAnalyze = () => {
    if (!description.trim()) return;
    navigation.replace("ScanResults", { textDescription: description.trim() });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        <View style={{ padding: spacing.lg, flex: 1 }}>
          <Text style={typography.h1}>Describe your meal</Text>
          <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>
            No photo needed — just tell us what you ate. Tap the microphone on your
            keyboard to dictate instead of typing.
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder='e.g. "Grilled chicken breast with a cup of rice and steamed broccoli"'
            placeholderTextColor={colors.textFaint}
            multiline
            numberOfLines={6}
            style={styles.input}
            autoFocus
          />

          <Button
            label="Analyze meal"
            onPress={onAnalyze}
            disabled={!description.trim()}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  input: {
    marginTop: spacing.lg,
    minHeight: 140,
    textAlignVertical: "top",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
});
