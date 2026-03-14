/**
 * Utility functions for handling time parsing and comparisons.
 */

/**
 * Parses a time string like "05:12 AM" into a Date object for the current day.
 * @param {string} timeStr - Time string in "hh:mm A" or "HH:mm" format.
 * @returns {Date} Date object set to today's date with the parsed time.
 */
export const parseTime = (timeStr) => {
    if (!timeStr) return null;

    // Split by space to separate time and time-period if it exists
    const parts = timeStr.trim().split(/\s+/);
    const time = parts[0];
    const period = parts[1] || null; // Could be undefined if 24h format

    let [hours, minutes] = time.split(':').map(Number);

    if (period) {
        if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
        }
        if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
        }
    }

    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    return date;
};

/**
 * Converts a time string (12h or 24h) to 12h format "h:mm A".
 * Examples: "15:43" -> "3:43 PM", "05:12" -> "5:12 AM"
 * @param {string} timeStr
 * @returns {string}
 */
export const formatTo12Hour = (timeStr) => {
    const date = parseTime(timeStr);
    if (!date) return timeStr;

    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

/**
 * Determines the next prayer based on current time.
 * @param {Array} prayers - Array of prayer objects { name: string, time: string (hh:mm A) }
 * @returns {Object} { nextPrayer: Object | null, isTomorrow: boolean }
 */
export const getNextPrayer = (prayers) => {
    if (!prayers || prayers.length === 0) return null;

    const now = new Date();

    // Sort prayers just in case
    const sortedPrayers = [...prayers].sort((a, b) => {
        return parseTime(a.time) - parseTime(b.time);
    });

    for (let i = 0; i < sortedPrayers.length; i++) {
        const prayerTime = parseTime(sortedPrayers[i].time);
        if (prayerTime > now) {
            return { nextPrayer: sortedPrayers[i], isTomorrow: false };
        }
    }

    // If we are past the last prayer, the next one is the first prayer of the next day
    return { nextPrayer: sortedPrayers[0], isTomorrow: true };
};

/**
 * Formats a Date object to a readable string like "Monday, 2 Oct 2023"
 * @param {Date} date
 * @param {string} locale - 'en' or 'ar'
 */
export const formatDate = (date, locale = 'en') => {
    const locales = locale === 'ar' ? 'ar-AE' : 'en-US';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(locales, options);
};

/**
 * Formats remaining duration into readable string.
 * @param {number} diffMs - Difference in milliseconds
 * @param {Function} t - Translation function
 * @returns {string} e.g. "1 hr 25 min" or "25 min"
 */
export const formatRemainingTime = (diffMs, t) => {
    if (diffMs <= 0) return '';

    const diffMins = Math.ceil(diffMs / (1000 * 60));

    if (diffMins < 60) {
        return `${diffMins} ${t('min')}`;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (mins === 0) {
        return `${hours} ${t('hour')}`;
    }

    return `${hours} ${t('hour')} ${mins} ${t('min')}`;
};
