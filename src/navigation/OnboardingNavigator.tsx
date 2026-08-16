import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/navigation/types";
import WelcomeScreen from "@/screens/onboarding/WelcomeScreen";
import GoalsScreen from "@/screens/onboarding/GoalsScreen";
import StatsScreen from "@/screens/onboarding/StatsScreen";
import ActivityLevelScreen from "@/screens/onboarding/ActivityLevelScreen";
import SummaryScreen from "@/screens/onboarding/SummaryScreen";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
      <Stack.Screen name="Summary" component={SummaryScreen} />
    </Stack.Navigator>
  );
}
