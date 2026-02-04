import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { parseTime, getNextPrayer } from '../utils/timeUtils';
import { processPrayerData } from './prayerApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const PRAYER_BACKGROUND_FETCH_TASK = 'PRAYER_BACKGROUND_FETCH_TASK';
const STORAGE_KEY_RAW_DATA = '@prayer_raw_data';
const REMINDER_MINUTES = 2;

/**
 * Configure how notifications behave when the app is in foreground.
 * CHANGE: We set shouldShowAlert to FALSE to prevent redundant notifications 
 * popping up immediately when the user is actively using/opening the app.
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false, // Don't show redundant alerts while app is open
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Configure notification channels for Android.
 */
export const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
        // High urgency channel for the "Alarm" (exact time)
        await Notifications.setNotificationChannelAsync('prayer-alarm', {
            name: 'Prayer Alarm (Exact Time)',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
            lightColor: '#FF0000',
            sound: 'default', // In a production app, this would be the Adhan file
            enableLights: true,
            enableVibrate: true,
            showBadge: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true, // Crucial for "Alarm" behavior
        });

        // High priority for the 2-minute reminder
        await Notifications.setNotificationChannelAsync('prayer-reminder', {
            name: 'Prayer Reminder (2 mins before)',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            enableVibrate: true,
            showBadge: false,
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
};

/**
 * Stores the raw API data for background use.
 */
export const storeRawDataForBackground = async (data) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEY_RAW_DATA, JSON.stringify(data));
    } catch (e) {
        console.error('Error storing raw data:', e);
    }
};

/**
 * Schedules notifications for the next upcoming prayer.
 * STRICT LOGIC:
 * 1. Only notifies 2 minutes before (Reminder).
 * 2. Acts as an alarm exactly at prayer time.
 * 3. Prevents "immediate" notifications unless within the 2-min window.
 */
export const schedulePrayerNotifications = async (prayers) => {
    try {
        // Always clear previous schedules to avoid "notification together" / duplicates
        await Notifications.cancelAllScheduledNotificationsAsync();

        if (!prayers || prayers.length === 0) return;

        const nextData = getNextPrayer(prayers);
        if (!nextData || !nextData.nextPrayer) return;

        const { nextPrayer, isTomorrow } = nextData;
        const prayerTime = parseTime(nextPrayer.time);

        if (isTomorrow) {
            prayerTime.setDate(prayerTime.getDate() + 1);
        }

        const now = new Date();
        const reminderTime = new Date(prayerTime.getTime() - (REMINDER_MINUTES * 60000));

        // --- 1. REMINDER (Exactly 2 minutes before) ---
        if (now < reminderTime) {
            // Future reminder: Schedule it
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `⏰ ${nextPrayer.name} Prayer Soon`,
                    body: `${nextPrayer.name} starts in ${REMINDER_MINUTES} minutes`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: { prayerName: nextPrayer.name, type: 'reminder' },
                    ...(Platform.OS === 'android' && { channelId: 'prayer-reminder' }),
                },
                trigger: reminderTime, // Use absolute date trigger for precision
            });
            console.log(`[Scheduled] Reminder for ${nextPrayer.name} at ${reminderTime.toLocaleTimeString()}`);
        } else if (now < prayerTime) {
            // Already inside the 2-min window: Notify ONCE immediately
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `⏰ ${nextPrayer.name} Prayer Soon`,
                    body: `${nextPrayer.name} starts in less than 2 minutes`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: { prayerName: nextPrayer.name, type: 'reminder' },
                    ...(Platform.OS === 'android' && { channelId: 'prayer-reminder' }),
                },
                trigger: null, // Fire immediately
            });
            console.log(`[Immediate] Reminder fired for ${nextPrayer.name} (inside 2-min window)`);
        }

        // --- 2. THE ALARM (Exact Time) ---
        if (now < prayerTime) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🕌 ${nextPrayer.name} Prayer Time`,
                    body: `It is now time for ${nextPrayer.name} prayer`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    sticky: true,       // Makes it alarm-like (harder to swipe away)
                    autoDismiss: false,  // Requires user interaction
                    data: { prayerName: nextPrayer.name, type: 'alarm' },
                    ...(Platform.OS === 'android' && {
                        channelId: 'prayer-alarm',
                        vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
                        // Note: FullScreenIntent is requested in app.json permissions
                        // For Android, importance: MAX is the primary driver of screen-wake behavior
                    }),
                },
                trigger: prayerTime, // Exact date trigger
            });
            console.log(`[Scheduled] Alarm for ${nextPrayer.name} at ${prayerTime.toLocaleTimeString()}`);
        }

    } catch (e) {
        console.error('Error in schedulePrayerNotifications:', e);
    }
};

/**
 * Registers the background fetch task.
 */
export const registerBackgroundTasks = async () => {
    if (Platform.OS === 'web') return;

    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(PRAYER_BACKGROUND_FETCH_TASK);
        if (!isRegistered) {
            await BackgroundFetch.registerTaskAsync(PRAYER_BACKGROUND_FETCH_TASK, {
                minimumInterval: 60 * 15,
                stopOnTerminate: false,
                startOnBoot: true,
            });
            console.log('Background fetch task registered');
        }
    } catch (err) {
        console.log('Background task registration failed:', err);
    }
};

/**
 * Background Task Definition
 * Runs periodically to ensure notifications are refreshed even if the app isn't opened.
 */
TaskManager.defineTask(PRAYER_BACKGROUND_FETCH_TASK, async () => {
    try {
        const now = new Date();
        const rawDataStr = await AsyncStorage.getItem(STORAGE_KEY_RAW_DATA);

        if (rawDataStr) {
            const rawData = JSON.parse(rawDataStr);
            const prayers = processPrayerData(rawData, now);
            await schedulePrayerNotifications(prayers);

            return BackgroundFetch.BackgroundFetchResult.NewData;
        }
    } catch (error) {
        console.error('Background task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
});
