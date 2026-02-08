import AsyncStorage from '@react-native-async-storage/async-storage';

const PRAYER_HISTORY_KEY = '@prayer_time_history';

/**
 * Adds prayer times for a specific date to history
 * @param {string} emirate - The emirate for which to store prayer times
 * @param {Date} date - The date for which to store prayer times
 * @param {Array} prayers - The prayer times to store
 */
export const addPrayerTimeToHistory = async (emirate, date, prayers) => {
  try {
    // Format date as YYYY-MM-DD for consistent storage
    const dateStr = formatDateKey(date);

    // Get existing history
    const history = await getPrayerTimeHistory();

    // Create or update entry for this emirate and date
    if (!history[emirate]) {
      history[emirate] = {};
    }

    history[emirate][dateStr] = {
      date: date.toISOString(),
      prayers: prayers,
      timestamp: new Date().toISOString()
    };

    // Save updated history
    await AsyncStorage.setItem(PRAYER_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error adding prayer time to history:', error);
  }
};

/**
 * Gets prayer time history for a specific emirate
 * @param {string} emirate - The emirate for which to get prayer times
 * @returns {Promise<Object>} The prayer time history for the emirate
 */
export const getPrayerTimeHistoryForEmirate = async (emirate) => {
  try {
    const history = await getPrayerTimeHistory();
    return history[emirate] || {};
  } catch (error) {
    console.error('Error getting prayer time history for emirate:', error);
    return {};
  }
};

/**
 * Gets all prayer time history
 * @returns {Promise<Object>} All prayer time history
 */
export const getPrayerTimeHistory = async () => {
  try {
    const historyJson = await AsyncStorage.getItem(PRAYER_HISTORY_KEY);
    if (historyJson) {
      return JSON.parse(historyJson);
    }
    return {};
  } catch (error) {
    console.error('Error getting prayer time history:', error);
    return {};
  }
};

/**
 * Gets prayer times for a specific date and emirate
 * @param {string} emirate - The emirate for which to get prayer times
 * @param {Date} date - The date for which to get prayer times
 * @returns {Promise<Object|null>} The prayer times for the date, or null if not found
 */
export const getPrayerTimeForDate = async (emirate, date) => {
  try {
    const dateStr = formatDateKey(date);
    const emirateHistory = await getPrayerTimeHistoryForEmirate(emirate);

    return emirateHistory[dateStr] || null;
  } catch (error) {
    console.error('Error getting prayer time for date:', error);
    return null;
  }
};

/**
 * Clears prayer time history for a specific emirate
 * @param {string} emirate - The emirate for which to clear history
 */
export const clearPrayerTimeHistoryForEmirate = async (emirate) => {
  try {
    const history = await getPrayerTimeHistory();

    if (history[emirate]) {
      delete history[emirate];
      await AsyncStorage.setItem(PRAYER_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error clearing prayer time history for emirate:', error);
  }
};

/**
 * Clears all prayer time history
 */
export const clearAllPrayerTimeHistory = async () => {
  try {
    await AsyncStorage.removeItem(PRAYER_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing all prayer time history:', error);
  }
};

/**
 * Formats a date as YYYY-MM-DD string for consistent storage
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Gets prayer times for the last N days for a specific emirate
 * @param {string} emirate - The emirate for which to get prayer times
 * @param {number} days - Number of days to retrieve (default 7)
 * @returns {Promise<Array>} Array of prayer times for the last N days
 */
export const getRecentPrayerTimes = async (emirate, days = 7) => {
  try {
    const emirateHistory = await getPrayerTimeHistoryForEmirate(emirate);
    const recentDates = [];

    // Generate the last N date strings
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDateKey(date);
      recentDates.push(dateStr);
    }

    // Get prayer times for these dates
    const recentPrayers = [];
    for (const dateStr of recentDates) {
      if (emirateHistory[dateStr]) {
        recentPrayers.push({
          date: dateStr,
          ...emirateHistory[dateStr]
        });
      }
    }

    // Sort by date (most recent first)
    recentPrayers.sort((a, b) => new Date(b.date) - new Date(a.date));

    return recentPrayers;
  } catch (error) {
    console.error('Error getting recent prayer times:', error);
    return [];
  }
};
