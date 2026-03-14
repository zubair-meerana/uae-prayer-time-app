import AsyncStorage from '@react-native-async-storage/async-storage';

const PRAYER_TRACKING_KEY = '@prayer_tracking';

/**
 * Marks a prayer as performed for a specific date
 * @param {string} emirate - The emirate for which to track the prayer
 * @param {Date} date - The date for which to track the prayer
 * @param {string} prayerName - The name of the prayer (e.g., 'Fajr', 'Dhuhr')
 * @param {boolean} performed - Whether the prayer was performed
 */
export const markPrayerPerformed = async (emirate, date, prayerName, performed = true) => {
  try {
    const dateStr = formatDateKey(date);

    // Get existing tracking data
    const tracking = await getPrayerTracking();

    // Create or update entry for this emirate and date
    if (!tracking[emirate]) {
      tracking[emirate] = {};
    }

    if (!tracking[emirate][dateStr]) {
      tracking[emirate][dateStr] = {};
    }

    tracking[emirate][dateStr][prayerName] = {
      performed,
      timestamp: new Date().toISOString()
    };

    // Save updated tracking
    await AsyncStorage.setItem(PRAYER_TRACKING_KEY, JSON.stringify(tracking));
  } catch (error) {
    console.error('Error marking prayer as performed:', error);
  }
};

/**
 * Gets prayer tracking for a specific emirate and date
 * @param {string} emirate - The emirate for which to get tracking
 * @param {Date} date - The date for which to get tracking
 * @returns {Promise<Object>} The prayer tracking for the date
 */
export const getPrayerTrackingForDate = async (emirate, date) => {
  try {
    const dateStr = formatDateKey(date);
    const tracking = await getPrayerTracking();

    if (tracking[emirate] && tracking[emirate][dateStr]) {
      return tracking[emirate][dateStr];
    }

    return {};
  } catch (error) {
    console.error('Error getting prayer tracking for date:', error);
    return {};
  }
};

/**
 * Gets all prayer tracking data
 * @returns {Promise<Object>} All prayer tracking data
 */
export const getPrayerTracking = async () => {
  try {
    const trackingJson = await AsyncStorage.getItem(PRAYER_TRACKING_KEY);
    if (trackingJson) {
      return JSON.parse(trackingJson);
    }
    return {};
  } catch (error) {
    console.error('Error getting prayer tracking:', error);
    return {};
  }
};

/**
 * Gets prayer tracking for a range of dates
 * @param {string} emirate - The emirate for which to get tracking
 * @param {Date} startDate - Start date for the range
 * @param {Date} endDate - End date for the range
 * @returns {Promise<Object>} The prayer tracking for the date range
 */
export const getPrayerTrackingForDateRange = async (emirate, startDate, endDate) => {
  try {
    const tracking = await getPrayerTracking();
    const result = {};

    if (!tracking[emirate]) {
      return result;
    }

    // Generate date range
    const dateRange = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateRange.push(formatDateKey(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get tracking for each date in range
    for (const dateStr of dateRange) {
      if (tracking[emirate][dateStr]) {
        result[dateStr] = tracking[emirate][dateStr];
      } else {
        result[dateStr] = {}; // Empty object for dates without tracking
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting prayer tracking for date range:', error);
    return {};
  }
};

/**
 * Resets prayer tracking for a specific date
 * @param {string} emirate - The emirate for which to reset tracking
 * @param {Date} date - The date for which to reset tracking
 */
export const resetPrayerTrackingForDate = async (emirate, date) => {
  try {
    const dateStr = formatDateKey(date);
    const tracking = await getPrayerTracking();

    if (tracking[emirate] && tracking[emirate][dateStr]) {
      delete tracking[emirate][dateStr];
      await AsyncStorage.setItem(PRAYER_TRACKING_KEY, JSON.stringify(tracking));
    }
  } catch (error) {
    console.error('Error resetting prayer tracking for date:', error);
  }
};

/**
 * Clears all prayer tracking data
 */
export const clearAllPrayerTracking = async () => {
  try {
    await AsyncStorage.removeItem(PRAYER_TRACKING_KEY);
  } catch (error) {
    console.error('Error clearing all prayer tracking:', error);
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
 * Gets the prayer status summary for a specific date
 * @param {string} emirate - The emirate for which to get summary
 * @param {Date} date - The date for which to get summary
 * @returns {Promise<Object>} Summary with counts of performed and missed prayers
 */
export const getPrayerSummaryForDate = async (emirate, date) => {
  try {
    const tracking = await getPrayerTrackingForDate(emirate, date);
    const allPrayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    let performedCount = 0;
    let missedCount = 0;

    allPrayers.forEach(prayer => {
      if (tracking[prayer] && tracking[prayer].performed) {
        performedCount++;
      } else if (tracking[prayer]) {
        missedCount++; // Explicitly marked as not performed
      }
    });

    const notRecordedCount = allPrayers.length - performedCount - missedCount;

    return {
      performed: performedCount,
      missed: missedCount,
      notRecorded: notRecordedCount,
      total: allPrayers.length
    };
  } catch (error) {
    console.error('Error getting prayer summary for date:', error);
    return {
      performed: 0,
      missed: 0,
      notRecorded: 6,
      total: 6
    };
  }
};
