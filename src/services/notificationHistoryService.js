import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_HISTORY_KEY = "@prayer_notification_history";
const MAX_HISTORY_ITEMS = 100; // Keep last 100 notifications

/**
 * Log a notification to history
 * @param {Object} notification - Notification data
 */
export const logNotificationToHistory = async (notification) => {
  try {
    const history = await getNotificationHistory();

    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...notification,
    };

    // Add new notification at the beginning
    const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);

    await AsyncStorage.setItem(
      NOTIFICATION_HISTORY_KEY,
      JSON.stringify(updatedHistory)
    );

    return true;
  } catch (error) {
    console.error("Error logging notification to history:", error);
    return false;
  }
};

/**
 * Get all notification history
 * @returns {Promise<Array>} Array of notification history entries
 */
export const getNotificationHistory = async () => {
  try {
    const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (historyJson) {
      return JSON.parse(historyJson);
    }
    return [];
  } catch (error) {
    console.error("Error getting notification history:", error);
    return [];
  }
};

/**
 * Clear all notification history
 */
export const clearNotificationHistory = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing notification history:", error);
    return false;
  }
};

/**
 * Get notification history for a specific date
 * @param {Date} date - Date to filter by
 * @returns {Promise<Array>} Filtered notification history
 */
export const getNotificationHistoryByDate = async (date) => {
  try {
    const history = await getNotificationHistory();
    const targetDate = date.toISOString().split("T")[0];

    return history.filter((item) => {
      const itemDate = item.timestamp.split("T")[0];
      return itemDate === targetDate;
    });
  } catch (error) {
    console.error("Error getting notification history by date:", error);
    return [];
  }
};

/**
 * Get notification history for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Filtered notification history
 */
export const getNotificationHistoryByRange = async (startDate, endDate) => {
  try {
    const history = await getNotificationHistory();
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    return history.filter((item) => {
      const itemDate = item.timestamp.split("T")[0];
      return itemDate >= start && itemDate <= end;
    });
  } catch (error) {
    console.error("Error getting notification history by range:", error);
    return [];
  }
};
