import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarCodeScanner } from "expo-barcode-scanner";
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<{
    meal: LoggedMeal;
    itemId: string;
  } | null>(null);
  const addLoggedMeal = useMealStore((s) => s.addLoggedMeal);

  React.useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

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

  const handleScan = async ({ data }: { data: string }) => {
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

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.emoji}>📦</Text>
        <Text style={typography.h2}>Camera access needed</Text>
        <Text
          style={[typography.bodyMuted, { textAlign: "center", marginTop: spacing.sm }]}
        >
          Plateful needs your camera to scan barcodes on packaged food.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleScan}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.overlay}>
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
