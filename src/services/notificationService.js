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
        await Notifications.setNotificationChannelAsync('prayer-alarm', {
            name: 'Prayer Alarms',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 500, 500],
            lightColor: '#00897B',
            sound: 'default',
            enableLights: true,
            enableVibrate: true,
            showBadge: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true, // Bypass Do Not Disturb
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
                    title: `🕌 ${prayer.name} Prayer Time`,
                    body: `It's time for ${prayer.name} prayer (${prayer.time})`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    sticky: false,
                    autoDismiss: false,
                    data: {
                        prayerName: prayer.name,
                        prayerTime: prayer.time
                    },
                    // Android specific
                    ...(Platform.OS === 'android' && {
                        channelId: 'prayer-alarm',
                        color: '#00897B',
                    }),
                },
                trigger: {
                    seconds: secondsUntil,
                    channelId: 'prayer-alarm', // for Android
                },
            });

            console.log(`Scheduled ${prayer.name} alarm in ${Math.round(secondsUntil / 60)} minutes`);
        }
    }
};
