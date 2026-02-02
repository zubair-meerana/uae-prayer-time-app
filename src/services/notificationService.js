import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseTime } from '../utils/timeUtils';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Request permissions for notifications.
 */
export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
    }
};

/**
 * Schedule notifications for the list of prayers.
 * NOTE: This cancels all previous notifications to avoid duplicates.
 * 
 * @param {Array} prayers - List of prayer objects { name, time }
 */
export const schedulePrayerNotifications = async (prayers) => {
    // Cancel all existing to ensure we don't duplicate
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    for (const prayer of prayers) {
        const prayerDate = parseTime(prayer.time);

        // Only schedule if the time is in the future for today
        if (prayerDate && prayerDate > now) {

            // Calculate seconds from now
            const secondsUntil = (prayerDate.getTime() - now.getTime()) / 1000;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "It's time for " + prayer.name,
                    body: `Time to pray ${prayer.name} (${prayer.time})`,
                    sound: 'default', // To use custom sound, reference the file configured in app.json
                    data: { data: 'goes here' },
                },
                trigger: {
                    seconds: secondsUntil,
                    channelId: 'default', // for Android
                },
            });

            console.log(`Scheduled ${prayer.name} in ${Math.round(secondsUntil / 60)} minutes`);
        }
    }
};
