import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "./src/context/LanguageContext";
import * as Notifications from "expo-notifications";
import * as BackgroundTask from "expo-background-task";
import { registerBackgroundTasks } from "./src/services/notificationService";
import { useEffect } from "react";
import { AppState } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Initialize background tasks
    registerBackgroundTasks();

    // Listen to app state changes to refresh notifications if needed
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // App became active, potentially refresh background tasks
        registerBackgroundTasks();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <LanguageProvider>
      <AppNavigator />
      <StatusBar style="dark" />
    </LanguageProvider>
  );
}
