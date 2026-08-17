import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { lookupBarcode, scaleToQuantity } from "@/services/openFoodFacts";
import { useMealStore } from "@/store/useMealStore";
import { FoodItem, LoggedMeal } from "@/types";
import { inferMealTypeFromHour } from "@/domain/mealMath";
import Button from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "BarcodeScanner">;

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<{
    meal: LoggedMeal;
    itemId: string;
  } | null>(null);
  const addLoggedMeal = useMealStore((s) => s.addLoggedMeal);

  const saveMeal = async (meal: LoggedMeal, itemId: string) => {
    setLoading(true);
    setSaveError(false);
    try {
      await addLoggedMeal(meal);
      navigation.replace("FoodItemEdit", { mealId: meal.id, itemId });
    } catch {
      setPendingMeal({ meal, itemId });
      setSaveError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async ({ data }: BarcodeScanningResult) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setNotFound(false);
    setSaveError(false);

    let product;
    try {
      product = await lookupBarcode(data);
    } catch {
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (!product) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const quantity = product.servingSizeG ?? 100;
    const scaled = scaleToQuantity(product, quantity);

    const item: FoodItem = {
      id: `item_${Date.now()}`,
      name: product.brand ? `${product.brand} ${product.name}` : product.name,
      quantity,
      unit: "g",
      calories: scaled.calories,
      proteinG: scaled.proteinG,
      carbsG: scaled.carbsG,
      fatG: scaled.fatG,
      fiberG: scaled.fiberG,
      sugarG: scaled.sugarG,
      sodiumMg: scaled.sodiumMg,
      source: "barcode",
      barcodeUpc: data,
    };

    const meal: LoggedMeal = {
      id: `meal_${Date.now()}`,
      userId: "local",
      loggedAt: new Date().toISOString(),
      mealType: inferMealTypeFromHour(new Date().getHours()),
      items: [item],
      totalCalories: item.calories,
      totalProteinG: item.proteinG,
      totalCarbsG: item.carbsG,
      totalFatG: item.fatG,
    };

    await saveMeal(meal, item.id);
  };

  const handleRetryScan = () => {
    setScanned(false);
    setNotFound(false);
  };

  const handleRetrySave = () => {
    if (pendingMeal) {
      saveMeal(pendingMeal.meal, pendingMeal.itemId);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.closeButtonLight}
        >
          <Text style={styles.closeTextLight}>✕</Text>
        </Pressable>
        <Text style={styles.emoji}>📦</Text>
        <Text style={typography.h2}>Camera access needed</Text>
        <Text
          style={[typography.bodyMuted, { textAlign: "center", marginTop: spacing.sm }]}
        >
          YumTrack needs your camera to scan barcodes on packaged food.
        </Text>
        <Button
          label="Allow camera access"
          onPress={requestPermission}
          style={{ marginTop: spacing.lg }}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleScan}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.overlay}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.frame} />
        <Text style={styles.hint}>Align barcode within the frame</Text>

        {loading && (
          <View style={styles.statusCard}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>
              Looking up product...
            </Text>
          </View>
        )}

        {notFound && (
          <View style={styles.statusCard}>
            <Text style={typography.h2}>Product not found</Text>
            <Text
              style={[
                typography.bodyMuted,
                { textAlign: "center", marginTop: spacing.xs },
              ]}
            >
              This item isn't in the Open Food Facts database yet. You can log it manually
              instead.
            </Text>
            <Button
              label="Try another barcode"
              onPress={handleRetryScan}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {saveError && (
          <View style={styles.statusCard}>
            <Text style={typography.h2}>Couldn't save this item</Text>
            <Text
              style={[
                typography.bodyMuted,
                { textAlign: "center", marginTop: spacing.xs },
              ]}
            >
              We found the product but couldn't log it. Check your connection and try
              again.
            </Text>
            <Button
              label="Try again"
              onPress={handleRetrySave}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: spacing.md,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  closeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  closeButtonLight: {
    position: "absolute",
    top: spacing.md,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  closeTextLight: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: radii.md,
  },
  hint: {
    color: "white",
    marginTop: spacing.md,
    fontWeight: "600",
  },
  statusCard: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
});
