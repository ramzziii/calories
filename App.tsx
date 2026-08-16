import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "@/navigation/RootNavigator";
import { initRevenueCat } from "@/services/revenuecat";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";
import { useUserStore } from "@/store/useUserStore";
import { useMealStore } from "@/store/useMealStore";
import { useWeightStore } from "@/store/useWeightStore";
import { useUnitsStore } from "@/store/useUnitsStore";

export default function App() {
  const isUserHydrated = useUserStore((s) => s.isHydrated);
  const isMealHydrated = useMealStore((s) => s.isHydrated);
  const isWeightHydrated = useWeightStore((s) => s.isHydrated);
  const isUnitsHydrated = useUnitsStore((s) => s.isHydrated);
  const isHydrated =
    isUserHydrated && isMealHydrated && isWeightHydrated && isUnitsHydrated;

  useEffect(() => {
    useUserStore.getState().hydrate();
    useMealStore.getState().hydrate();
    useWeightStore.getState().hydrate();
    useUnitsStore.getState().hydrate();
  }, []);

  useEffect(() => {
    // Safe to call even without real API keys yet — see services/revenuecat.ts.
    try {
      initRevenueCat();
    } catch (err) {
      console.warn("RevenueCat not configured yet:", err);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ErrorBoundary>{isHydrated ? <RootNavigator /> : <LoadingScreen />}</ErrorBoundary>
    </SafeAreaProvider>
  );
}
