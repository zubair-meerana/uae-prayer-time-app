import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import NotificationHistoryScreen from "../screens/NotificationHistoryScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Notifications (includes Settings and History)
function NotificationsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
      <Stack.Screen
        name="NotificationHistory"
        component={NotificationHistoryScreen}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isRTL } = useLanguage();

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: "#00897B",
          background: "#F5F5F5",
          card: "#FFFFFF",
          text: "#000000",
          border: "#E0E0E0",
          notification: "#FF0000",
        },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "History") {
              iconName = focused ? "calendar" : "calendar-outline";
            } else if (route.name === "Notifications") {
              iconName = focused ? "notifications" : "notifications-outline";
            }

            return (
              <Ionicons
                name={iconName}
                size={size}
                color={color}
                style={{ marginBottom: -4 }}
              />
            );
          },
          tabBarActiveTintColor: "#00897B",
          tabBarInactiveTintColor: "#9E9E9E",
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 60,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerShown: false,
          tabBarStyle: {
            direction: isRTL ? "rtl" : "ltr",
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home" }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: "History" }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsStackNavigator}
          options={{ title: "Notifications" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
