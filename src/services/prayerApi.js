import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculatePrayerTimes } from "../utils/prayerCalculationUtils";

/**
 * Service for fetching prayer times from Khaleej Times API.
 * Supports caching data locally for the current month.
 */

const BASE_URL = "https://www.khaleejtimes.com/contentapi/v1/prayertimings";

const AVAILABLE_EMIRATES = [
  { label: "Dubai", value: "dubai" },
  { label: "Abu Dhabi", value: "abu-dhabi" },
  { label: "Ajman", value: "ajman" },
  { label: "Sharjah", value: "sharjah" },
  { label: "Umm Al Quwain", value: "umm-al-quwain" },
  { label: "Fujairah", value: "fujairah" },
  { label: "Ras Al Khaimah", value: "ras-al-khaimah" },
];

export const getAvailableEmirates = () => AVAILABLE_EMIRATES;

/**
 * Validates if the cached data belongs to the current month and year.
 * @param {Object} cacheEntry - { month: number, year: number, data: Object }
 * @returns {boolean}
 */
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;

  // Validate structure
  if (
    typeof cacheEntry.month !== "number" ||
    typeof cacheEntry.year !== "number" ||
    !cacheEntry.data
  ) {
    console.warn("Invalid cache structure detected");
    return false;
  }

  const now = new Date();
  // Check if cache matches current Gregorian month and year
  const isValidMonthYear =
    cacheEntry.month === now.getMonth() &&
    cacheEntry.year === now.getFullYear();

  if (!isValidMonthYear) {
    console.log("Cache expired: month/year mismatch");
    return false;
  }

  // Additional validation: check if data structure is intact
  if (
    !cacheEntry.data ||
    !cacheEntry.data.data ||
    !cacheEntry.data.data.timings
  ) {
    console.warn("Cache data structure is corrupted");
    return false;
  }

  // Check if the data contains expected number of days for the month
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const timingsCount = Array.isArray(cacheEntry.data.data.timings)
    ? cacheEntry.data.data.timings.length
    : 0;

  // Allow some flexibility (some APIs might not have data for all days)
  if (timingsCount < Math.floor(daysInMonth * 0.8)) {
    console.warn(
      `Cache data seems incomplete (${timingsCount}/${daysInMonth} days)`,
    );
    return false;
  }

  return true;
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
    if (Platform.OS === "web") {
      fetchUrl = `https://corsproxy.io/?${encodeURIComponent(fetchUrl)}`;
    }

    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    // 3. Save to cache with current timestamp info
    const now = new Date();
    const cachePayload = {
      month: now.getMonth(),
      year: now.getFullYear(),
      data: data,
    };

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

    return data;
  } catch (error) {
    console.error("Error fetching prayer times:", error);

    // If API fails, try to return expired cache
    try {
      const cachedString = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedString) {
        const cached = JSON.parse(cachedString);
        if (cached && cached.data) {
          console.log("[API] Using expired cached data as fallback");
          return cached.data;
        }
      }
    } catch (cacheError) {
      console.error("Error accessing expired cache:", cacheError);
    }

    // If no cache available, calculate prayer times as ultimate fallback
    try {
      console.log("[API] Calculating prayer times as ultimate fallback");
      const calculatedTimes = await calculateFallbackPrayerTimes(location);

      // Format the calculated times to match API structure
      const calculatedData = {
        data: {
          timings: [
            {
              day: new Date().getDate(),
              timings: {
                fajr:
                  calculatedTimes.find((p) => p.name === "Fajr")?.time ||
                  "05:30",
                sunrise:
                  calculatedTimes.find((p) => p.name === "Sunrise")?.time ||
                  "06:45",
                dhuhr:
                  calculatedTimes.find((p) => p.name === "Dhuhr")?.time ||
                  "12:30",
                asr:
                  calculatedTimes.find((p) => p.name === "Asr")?.time ||
                  "15:45",
                maghrib:
                  calculatedTimes.find((p) => p.name === "Maghrib")?.time ||
                  "18:15",
                isha:
                  calculatedTimes.find((p) => p.name === "Isha")?.time ||
                  "19:45",
              },
            },
          ],
        },
      };

      return calculatedData;
    } catch (calculationError) {
      console.error("Error calculating prayer times:", calculationError);
      throw error; // Re-throw original error if everything fails
    }
  }
};

/**
 * Helper to process the API response into a simple list of prayers.
 * Handles structure: { data: { timings: [ { day: 1, timings: { fajr: ".." } } ] } }
 * @param {Object} apiData - The raw API response
 * @param {Date} date - The date to extract timings for (defaults to today)
 */
export const processPrayerData = (apiData, date = new Date()) => {
  if (!apiData) return [];

  // 1. Locate the timings array
  const timingsData = apiData.data?.timings || apiData.timings;

  if (!timingsData) return [];

  let targetTimings = null;

  // 2. Determine if it's an array (monthly/daily list) or object
  if (Array.isArray(timingsData)) {
    const targetDay = date.getDate();
    // Find the entry for the target day
    const match = timingsData.find((t) => t.day === targetDay && t.timings);

    if (match) {
      targetTimings = match.timings;
    } else if (timingsData.length > 0) {
      // Fallback: If exact day not found (e.g., end of month edge case), use first
      // But ideally we should return null or handle appropriately.
      // For now, keeping existing fallback behavior but it might be unsafe for "Next Day" logic if day doesn't exist.
      targetTimings = timingsData[0].timings;
    }
  } else {
    targetTimings = timingsData;
  }

  if (!targetTimings) return [];

  // 3. Map keys to standard UI format (Title Case)
  const standardKeys = [
    { key: "fajr", label: "Fajr" },
    { key: "sunrise", label: "Sunrise" },
    { key: "dhuhr", label: "Dhuhr" },
    { key: "asr", label: "Asr" },
    { key: "maghrib", label: "Maghrib" },
    { key: "isha", label: "Isha" },
  ];

  const prayers = standardKeys
    .map((item) => {
      const time = targetTimings[item.key] || targetTimings[item.label];
      if (time) {
        return {
          name: item.label,
          time: time,
        };
      }
      return null;
    })
    .filter(Boolean);

  // Extract Hijri information if available
  let hijriInfo = null;
  if (Array.isArray(timingsData)) {
    const targetDay = date.getDate();
    const match = timingsData.find((t) => t.day === targetDay && t.timings);

     if (match) {
       hijriInfo = {
         day: match.hijri_day,
         month: match.month, // Hijri month name
         year: match.hijri_year || apiData.data?.year, // Hijri year
         day_name: match.day_name,
       };
     }
  }

  return {
    prayers,
    hijri: hijriInfo,
  };
};

/**
 * Calculates prayer times as fallback when API is unavailable
 * @param {string} location - The location/emirate name
 * @param {Date} date - The date for which to calculate prayer times
 * @returns {Array} Array of prayer times in format {name: string, time: string}
 */
export const calculateFallbackPrayerTimes = async (
  location,
  date = new Date(),
) => {
  // Define approximate coordinates for UAE emirates
  const emirateCoordinates = {
    dubai: { lat: 25.2048, lng: 55.2708, tz: 4 }, // GMT+4
    "abu-dhabi": { lat: 24.4539, lng: 54.3773, tz: 4 },
    sharjah: { lat: 25.0752, lng: 55.7571, tz: 4 },
    ajman: { lat: 25.4052, lng: 55.5136, tz: 4 },
    "ras-al-khaimah": { lat: 25.6753, lng: 55.9803, tz: 4 },
    fujairah: { lat: 25.1167, lng: 56.3333, tz: 4 },
    "umm-al-quwain": { lat: 25.5692, lng: 55.5598, tz: 4 },
  };

  const coords = emirateCoordinates[location] || emirateCoordinates["dubai"]; // Default to Dubai

  return calculatePrayerTimes(coords.lat, coords.lng, coords.tz, date);
};
