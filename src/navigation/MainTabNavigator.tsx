import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "@/navigation/types";
import DashboardScreen from "@/screens/home/DashboardScreen";
import CustomMealsScreen from "@/screens/meals/CustomMealsScreen";
import WeightTrackingScreen from "@/screens/weight/WeightTrackingScreen";
import SettingsScreen from "@/screens/settings/SettingsScreen";
import { colors } from "@/theme/theme";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  DashboardTab: "🏠",
  MealsTab: "🍱",
  WeightTab: "📈",
  SettingsTab: "⚙️",
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarIcon: () => (
          <Text style={{ fontSize: 20 }}>
            {ICONS[route.name as keyof MainTabParamList]}
          </Text>
        ),
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: "Today" }}
      />
      <Tab.Screen
        name="MealsTab"
        component={CustomMealsScreen}
        options={{ title: "Meals" }}
      />
      <Tab.Screen
        name="WeightTab"
        component={WeightTrackingScreen}
        options={{ title: "Weight" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
}
