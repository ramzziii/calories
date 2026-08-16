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
import { useFoodCorrectionsStore } from "@/store/useFoodCorrectionsStore";
import { useHealthSyncStore } from "@/store/useHealthSyncStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function App() {
  const isUserHydrated = useUserStore((s) => s.isHydrated);
  const isMealHydrated = useMealStore((s) => s.isHydrated);
  const isWeightHydrated = useWeightStore((s) => s.isHydrated);
  const isUnitsHydrated = useUnitsStore((s) => s.isHydrated);
  const isCorrectionsHydrated = useFoodCorrectionsStore((s) => s.isHydrated);
  const isHealthSyncHydrated = useHealthSyncStore((s) => s.isHydrated);
  const isAuthHydrated = useAuthStore((s) => s.isHydrated);
  const authUserId = useAuthStore((s) => s.user?.id);
  const isHydrated =
    isUserHydrated &&
    isMealHydrated &&
    isWeightHydrated &&
    isUnitsHydrated &&
    isCorrectionsHydrated &&
    isHealthSyncHydrated &&
    isAuthHydrated;

  useEffect(() => {
    useUserStore.getState().hydrate();
    useMealStore.getState().hydrate();
    useWeightStore.getState().hydrate();
    useUnitsStore.getState().hydrate();
    useFoodCorrectionsStore.getState().hydrate();
    useHealthSyncStore.getState().hydrate();
    useAuthStore.getState().hydrate();
  }, []);

  useEffect(() => {
    // Safe to call even without real API keys yet — see
    // services/revenuecat.ts. Passing the Supabase user id as RevenueCat's
    // appUserID is what lets the revenuecat-webhook Edge Function match
    // incoming events back to the right subscriptions row.
    if (!authUserId) return;
    try {
      initRevenueCat(authUserId);
    } catch (err) {
      console.warn("RevenueCat not configured yet:", err);
    }
  }, [authUserId]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ErrorBoundary>{isHydrated ? <RootNavigator /> : <LoadingScreen />}</ErrorBoundary>
    </SafeAreaProvider>
  );
}
