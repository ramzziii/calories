import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useUserStore } from "@/store/useUserStore";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import CameraCaptureScreen from "@/screens/logging/CameraCaptureScreen";
import ScanResultsScreen from "@/screens/logging/ScanResultsScreen";
import FoodItemEditScreen from "@/screens/logging/FoodItemEditScreen";
import BarcodeScannerScreen from "@/screens/logging/BarcodeScannerScreen";
import SaveMealScreen from "@/screens/meals/SaveMealScreen";
import PaywallScreen from "@/screens/paywall/PaywallScreen";
import SupportScreen from "@/screens/settings/SupportScreen";
import FAQScreen from "@/screens/settings/FAQScreen";
import SubscriptionScreen from "@/screens/settings/SubscriptionScreen";
import { colors } from "@/theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const profile = useUserStore((s) => s.profile);
  const hasCompletedOnboarding = !!profile?.onboardingComplete;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="CameraCapture" component={CameraCaptureScreen} />
            <Stack.Screen name="ScanResults" component={ScanResultsScreen} />
            <Stack.Screen
              name="FoodItemEdit"
              component={FoodItemEditScreen}
              options={{
                headerShown: true,
                title: "Edit item",
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
              }}
            />
            <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
            <Stack.Screen
              name="SaveMeal"
              component={SaveMealScreen}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="Support"
              component={SupportScreen}
              options={{
                headerShown: true,
                title: "Support",
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
              }}
            />
            <Stack.Screen
              name="FAQ"
              component={FAQScreen}
              options={{
                headerShown: true,
                title: "FAQ",
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
              }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{
                headerShown: true,
                title: "Subscription",
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
