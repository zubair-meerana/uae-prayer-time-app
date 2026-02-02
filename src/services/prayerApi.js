import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service for fetching prayer times from Khaleej Times API.
 * Supports caching data locally for the current month.
 */

const BASE_URL = 'https://www.khaleejtimes.com/contentapi/v1/prayertimings';

const AVAILABLE_EMIRATES = [
    { label: 'Dubai', value: 'dubai' },
    { label: 'Abu Dhabi', value: 'abu-dhabi' },
    { label: 'Ajman', value: 'ajman' },
    { label: 'Sharjah', value: 'sharjah' },
    { label: 'Umm Al Quwain', value: 'umm-al-quwain' },
    { label: 'Fujairah', value: 'fujairah' },
    { label: 'Ras Al Khaimah', value: 'ras-al-khaimah' },
];

export const getAvailableEmirates = () => AVAILABLE_EMIRATES;

/**
 * Validates if the cached data belongs to the current month and year.
 * @param {Object} cacheEntry - { month: number, year: number, data: Object }
 * @returns {boolean}
 */
const isCacheValid = (cacheEntry) => {
    if (!cacheEntry) return false;
    const now = new Date();
    // Check if cache matches current Gregorian month and year
    return cacheEntry.month === now.getMonth() && cacheEntry.year === now.getFullYear();
};

/**
 * Fetch prayer timings for a specific location.
 * Strategy: Check Local Storage -> If valid (current month), return it -> Else Fetch API -> Cache it.
 * 
 * @param {string} location - One of the allowed emirate values (e.g., 'dubai')
 * @returns {Promise<Object>} - The raw API response.
 */
export const fetchPrayerTimings = async (location) => {
    const CACHE_KEY = `prayer_timings_${location}`;

    try {
        // 1. Try to get invalid cache first to fail simpler? No, try to get valid cache.
        const cachedString = await AsyncStorage.getItem(CACHE_KEY);

        if (cachedString) {
            const cached = JSON.parse(cachedString);
            if (isCacheValid(cached)) {
                console.log(`[API] Using cached data for ${location}`);
                return cached.data;
            }
        }

        // 2. Fetch fresh data
        console.log(`[API] Fetching fresh data for ${location}`);

        let fetchUrl = `${BASE_URL}?location=${location}`;
        if (Platform.OS === 'web') {
            fetchUrl = `https://corsproxy.io/?${encodeURIComponent(fetchUrl)}`;
        }

        const response = await fetch(fetchUrl);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // 3. Save to cache with current timestamp info
        const now = new Date();
        const cachePayload = {
            month: now.getMonth(),
            year: now.getFullYear(),
            data: data
        };

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

        return data;

    } catch (error) {
        console.error('Error fetching prayer times:', error);
        // Optional: Return expired cache if network fails? 
        // For now, we verify basic error handling in UI.
        throw error;
    }
};

/**
 * Helper to process the API response into a simple list of prayers.
 * Handles structure: { data: { timings: [ { day: 1, timings: { fajr: ".." } } ] } }
 */
export const processPrayerData = (apiData) => {
    if (!apiData) return [];

    // 1. Locate the timings array
    const timingsData = apiData.data?.timings || apiData.timings;

    if (!timingsData) return [];

    let todayTimings = null;

    // 2. Determine if it's an array (monthly/daily list) or object
    if (Array.isArray(timingsData)) {
        const todayDay = new Date().getDate();
        // Find the entry for today
        const match = timingsData.find(t => t.day === todayDay && t.timings);

        if (match) {
            todayTimings = match.timings;
        } else if (timingsData.length > 0) {
            todayTimings = timingsData[0].timings;
        }
    } else {
        todayTimings = timingsData;
    }

    if (!todayTimings) return [];

    // 3. Map keys to standard UI format (Title Case)
    const standardKeys = [
        { key: 'fajr', label: 'Fajr' },
        { key: 'sunrise', label: 'Sunrise' },
        { key: 'dhuhr', label: 'Dhuhr' },
        { key: 'asr', label: 'Asr' },
        { key: 'maghrib', label: 'Maghrib' },
        { key: 'isha', label: 'Isha' }
    ];

    const prayers = standardKeys.map(item => {
        const time = todayTimings[item.key] || todayTimings[item.label];
        if (time) {
            return {
                name: item.label,
                time: time
            };
        }
        return null;
    }).filter(Boolean);

    return prayers;
};
