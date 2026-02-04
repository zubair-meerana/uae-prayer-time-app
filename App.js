import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { LanguageProvider } from './src/context/LanguageContext';
import * as Notifications from 'expo-notifications';
import { registerBackgroundTasks } from './src/services/notificationService';
import { useEffect } from 'react';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function App() {
    useEffect(() => {
        // Initialize background tasks
        registerBackgroundTasks();
    }, []);

    return (
        <LanguageProvider>
            <View style={styles.container}>
                <HomeScreen />
                <StatusBar style="dark" />
            </View>
        </LanguageProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
});
