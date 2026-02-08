import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { Platform, AppState } from "react-native";
import { parseTime, getNextPrayer } from "../utils/timeUtils";
import { processPrayerData, fetchPrayerTimings } from "./prayerApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  playAlarmSound,
  stopAlarmSound,
  configureAudioMode,
} from "./audioService";

// Constants
const PRAYER_BACKGROUND_TASK = "PRAYER_BACKGROUND_TASK";
const STORAGE_KEY_RAW_DATA = "@prayer_raw_data";
const REMINDER_MINUTES = 2;

/**
 * Configure how notifications behave when the app is in foreground.
 * CHANGE: We set shouldShowAlert to FALSE to prevent redundant notifications
 * popping up immediately when the user is actively using/opening the app.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show alerts for test alarms and prayer times
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Configure notification channels for Android.
 */
export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === "android") {
    // High urgency channel for the "Alarm" (exact time)
    await Notifications.setNotificationChannelAsync("prayer-alarm", {
      name: "Prayer Alarm (Exact Time)",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
      lightColor: "#FF0000",
      sound: "default",
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    // High priority for the 2-minute reminder
    await Notifications.setNotificationChannelAsync("prayer-reminder", {
      name: "Prayer Reminder (2 mins before)",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      enableVibrate: true,
      showBadge: false,
    });
  }

  // Updated permissions API for Expo SDK 54+
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
};

/**
 * Stores the raw API data for background use.
 */
export const storeRawDataForBackground = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_RAW_DATA, JSON.stringify(data));
  } catch (e) {
    console.error("Error storing raw data:", e);
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
    const reminderTime = new Date(
      prayerTime.getTime() - REMINDER_MINUTES * 60000,
    );

    // --- 1. REMINDER (Exactly 2 minutes before) ---
    if (now < reminderTime) {
      // Future reminder: Schedule it
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${nextPrayer.name} Prayer Soon`,
          body: `${nextPrayer.name} starts in ${REMINDER_MINUTES} minutes`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { prayerName: nextPrayer.name, type: "reminder" },
          ...(Platform.OS === "android" && { channelId: "prayer-reminder" }),
        },
        trigger: {
          date: reminderTime, // Use absolute date trigger for precision
        },
      });
      console.log(
        `[Scheduled] Reminder for ${nextPrayer.name} at ${reminderTime.toLocaleTimeString()}`,
      );
    } else if (now < prayerTime) {
      // Already inside the 2-min window: Notify ONCE immediately
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${nextPrayer.name} Prayer Soon`,
          body: `${nextPrayer.name} starts in less than 2 minutes`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { prayerName: nextPrayer.name, type: "reminder" },
          ...(Platform.OS === "android" && { channelId: "prayer-reminder" }),
        },
        trigger: null, // Fire immediately
      });
      console.log(
        `[Immediate] Reminder fired for ${nextPrayer.name} (inside 2-min window)`,
      );
    }

    // Get notification settings from AsyncStorage
    const notificationSettings = await getNotificationSettings();
    const prayerSettings = notificationSettings[nextPrayer.name] || {
      reminderEnabled: true,
      alarmEnabled: true,
      vibration: true,
    };

    // --- 2. THE ALARM (Exact Time) ---
    if (prayerSettings.alarmEnabled && now < prayerTime) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕌 ${nextPrayer.name} Prayer Time`,
          body: `It is now time for ${nextPrayer.name} prayer`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: true, // Makes it alarm-like (harder to swipe away)
          autoDismiss: false, // Requires user interaction
          data: { prayerName: nextPrayer.name, type: "alarm" },
          ...(Platform.OS === "android" && {
            channelId: "prayer-alarm",
            vibrationPattern: prayerSettings.vibration
              ? [0, 1000, 500, 1000, 500, 1000]
              : null,
            category: "alarm",
            interruptionFilter: "priority",
            lockScreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
            fullScreenIntent: true, // This enables full-screen notifications
          }),
        },
        trigger: {
          date: prayerTime, // Exact date trigger
        },
      });
      console.log(
        `[Scheduled] Alarm for ${nextPrayer.name} at ${prayerTime.toLocaleTimeString()}`,
      );
    }
  } catch (e) {
    console.error("Error in schedulePrayerNotifications:", e);
  }
};

/**
 * Registers the background fetch task.
 */
export const registerBackgroundTasks = async () => {
  if (Platform.OS === "web") return;

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      PRAYER_BACKGROUND_TASK,
    );
    if (!isRegistered) {
      await BackgroundTask.registerTaskAsync(PRAYER_BACKGROUND_TASK, {
        minimumInterval: 60 * 5, // Every 5 minutes for more frequent checks
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Background task registered");
    }
  } catch (err) {
    console.log("Background task registration failed:", err);

    // Fallback: try with different configuration for better compatibility
    try {
      await BackgroundTask.registerTaskAsync(PRAYER_BACKGROUND_TASK, {
        minimumInterval: 60 * 15, // 15 minutes as fallback
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Background task registered with fallback config");
    } catch (fallbackErr) {
      console.log(
        "Background task registration failed with fallback too:",
        fallbackErr,
      );
    }
  }
};

/**
 * Pre-schedule prayer notifications for the entire month when app starts or updates prayer times
 * This ensures notifications fire even if the app is closed
 */
export const preScheduleMonthlyPrayerNotifications = async (
  rawData,
  selectedEmirate,
) => {
  try {
    // Cancel any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!rawData || !rawData.data || !rawData.data.timings) return;

    // Get notification settings
    const notificationSettings = await getNotificationSettings();

    // Get the full month's prayer data
    const monthlyTimings = rawData.data.timings;

    // Process each day of the month
    for (const dayData of monthlyTimings) {
      const dayNumber = dayData.day;
      const dayPrayers = dayData.timings;

      if (!dayPrayers) continue;

      // Create a date for this specific day
      const currentDate = new Date();
      const targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        dayNumber,
      );

      // Skip if this date is in the past
      if (targetDate < new Date()) continue;

      // Process each prayer for this day
      for (const [prayerName, prayerTimeString] of Object.entries(dayPrayers)) {
        // Skip if this is not a prayer time (like date fields)
        if (
          !prayerTimeString ||
          typeof prayerTimeString !== "string" ||
          !prayerTimeString.includes(":")
        )
          continue;

        // Parse the prayer time for this specific day
        const prayerTime = parseTimeForDate(prayerTimeString, targetDate);
        const now = new Date();

        // Only schedule for future times
        if (prayerTime > now) {
          const prayerSettings = notificationSettings[prayerName] || {
            reminderEnabled: true,
            alarmEnabled: true,
            vibration: true,
          };

          // Schedule the main prayer alarm if enabled
          if (prayerSettings.alarmEnabled) {
            await Notifications.scheduleNotificationAsync(
              {
                title: `🕌 ${prayerName} Prayer Time`,
                body: `It is now time for ${prayerName} prayer`,
                sound: "default",
                priority: Notifications.AndroidNotificationPriority.MAX,
                sticky: true,
                autoDismiss: false,
                data: {
                  prayerName,
                  type: "alarm",
                  date: targetDate.toISOString(),
                },
                ...(Platform.OS === "android" && {
                  channelId: "prayer-alarm",
                  vibrationPattern: prayerSettings.vibration
                    ? [0, 1000, 500, 1000, 500, 1000]
                    : null,
                  category: "alarm",
                  interruptionFilter: "priority",
                  lockScreenVisibility:
                    Notifications.AndroidNotificationVisibility.PUBLIC,
                  fullScreenIntent: true,
                }),
                ios: {
                  sound: "default",
                  _tag: `prayer-${prayerName}-${targetDate.toISOString()}`, // Unique identifier
                },
              },
              {
                date: prayerTime,
              },
            );

            console.log(
              `[Pre-scheduled] Alarm for ${prayerName} on ${targetDate.toDateString()} at ${prayerTime.toLocaleTimeString()}`,
            );
          }

          // Schedule reminder if enabled
          if (prayerSettings.reminderEnabled) {
            const reminderTime = new Date(
              prayerTime.getTime() - REMINDER_MINUTES * 60000,
            );

            if (reminderTime > now) {
              await Notifications.scheduleNotificationAsync(
                {
                  title: `⏰ ${prayerName} Prayer Soon`,
                  body: `${prayerName} starts in ${REMINDER_MINUTES} minutes`,
                  sound: "default",
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                  data: {
                    prayerName,
                    type: "reminder",
                    date: targetDate.toISOString(),
                  },
                  ...(Platform.OS === "android" && {
                    channelId: "prayer-reminder",
                  }),
                  ios: {
                    sound: "default",
                    _tag: `reminder-${prayerName}-${targetDate.toISOString()}`, // Unique identifier
                  },
                },
                {
                  date: reminderTime,
                },
              );

              console.log(
                `[Pre-scheduled] Reminder for ${prayerName} on ${targetDate.toDateString()} at ${reminderTime.toLocaleTimeString()}`,
              );
            }
          }
        }
      }
    }

    // Store the selected emirate for background tasks to use
    await AsyncStorage.setItem("@last_known_emirate", selectedEmirate);
  } catch (e) {
    console.error("Error in preScheduleMonthlyPrayerNotifications:", e);
  }
};

/**
 * Parse time string for a specific date
 * @param {string} timeStr - Time string in "HH:MM" or "HH:MM AM/PM" format
 * @param {Date} date - Date to attach the time to
 * @returns {Date} - Date object with the parsed time
 */
const parseTimeForDate = (timeStr, date) => {
  // Create a new date based on the target date
  const resultDate = new Date(date);

  // Handle different time formats
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    // 12-hour format (e.g., "5:30 AM")
    const [timePart, period] = timeStr.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (period.toUpperCase() === "PM" && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    resultDate.setHours(hours, minutes, 0, 0);
  } else {
    // 24-hour format (e.g., "05:30")
    const [hours, minutes] = timeStr.split(":").map(Number);
    resultDate.setHours(hours, minutes, 0, 0);
  }

  return resultDate;
};

/**
 * Background Task Definition
 * Runs periodically to ensure notifications are refreshed even if the app isn't opened.
 */
TaskManager.defineTask(PRAYER_BACKGROUND_TASK, async () => {
  try {
    const now = new Date();
    const rawDataStr = await AsyncStorage.getItem(STORAGE_KEY_RAW_DATA);

    if (rawDataStr) {
      const rawData = JSON.parse(rawDataStr);
      const prayers = processPrayerData(rawData, now);
      // Use the pre-scheduling function to ensure all monthly notifications are scheduled
      const lastKnownEmirate = await AsyncStorage.getItem(
        "@last_known_emirate",
      );
      if (lastKnownEmirate) {
        await preScheduleMonthlyPrayerNotifications(rawData, lastKnownEmirate);
      }

      return BackgroundTask.BackgroundTaskResult.NewData;
    }

    // If no stored data, try to fetch fresh data
    try {
      // Get the last known location/emirate from storage
      const lastKnownEmirate = await AsyncStorage.getItem(
        "@last_known_emirate",
      );
      if (lastKnownEmirate) {
        const freshData = await fetchPrayerTimings(lastKnownEmirate);
        await preScheduleMonthlyPrayerNotifications(
          freshData,
          lastKnownEmirate,
        );

        // Store the fresh data for future background tasks
        await storeRawDataForBackground(freshData);

        return BackgroundTask.BackgroundTaskResult.NewData;
      }
    } catch (fetchError) {
      console.error("Background task: Failed to fetch fresh data:", fetchError);
    }
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
  return BackgroundTask.BackgroundTaskResult.NoData;
});

/**
 * Gets notification settings from AsyncStorage
 * @returns {Promise<Object>} Notification settings
 */
export const getNotificationSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem("@notification_settings");
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
    // Default settings
    return {
      Fajr: { reminderEnabled: true, alarmEnabled: true, vibration: true },
      Sunrise: { reminderEnabled: true, alarmEnabled: false, vibration: true },
      Dhuhr: { reminderEnabled: true, alarmEnabled: true, vibration: true },
      Asr: { reminderEnabled: true, alarmEnabled: true, vibration: true },
      Maghrib: { reminderEnabled: true, alarmEnabled: true, vibration: true },
      Isha: { reminderEnabled: true, alarmEnabled: true, vibration: true },
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    // Return default settings
    return {
      Fajr: { reminderEnabled: true, alarmEnabled: true, vibration: true },
      Sunrise: { reminderEnabled: true, alarmEnabled: false, vibration: true },
      Dhuhr: { reminderEnabled: true, alarmEnabled: true, vibration: true },
      Asr: { reminderEnabled: true, alarmEnabled: true, vibration: true },
      Maghrib: { reminderEnabled: true, alarmEnabled: true, vibration: true },
      Isha: { reminderEnabled: true, alarmEnabled: true, vibration: true },
    };
  }
};

/**
 * Saves notification settings to AsyncStorage
 * @param {Object} settings - Notification settings to save
 */
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(
      "@notification_settings",
      JSON.stringify(settings),
    );
  } catch (error) {
    console.error("Error saving notification settings:", error);
  }
};
