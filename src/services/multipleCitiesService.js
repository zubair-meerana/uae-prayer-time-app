import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPrayerTimings, processPrayerData } from './prayerApi';

const MULTIPLE_CITIES_KEY = '@multiple_cities_prayer_times';

/**
 * Adds a city to the multiple cities list
 * @param {string} cityName - Name of the city to add
 * @param {string} locationCode - Location code for the city (e.g., 'dubai', 'abu-dhabi')
 */
export const addCityToMultipleCities = async (cityName, locationCode) => {
  try {
    const cities = await getMultipleCities();

    // Check if city already exists
    const exists = cities.some(city => city.locationCode === locationCode);
    if (exists) {
      return; // City already in the list
    }

    // Add new city
    const newCity = {
      name: cityName,
      locationCode: locationCode,
      addedAt: new Date().toISOString()
    };

    cities.push(newCity);

    // Save updated list
    await AsyncStorage.setItem(MULTIPLE_CITIES_KEY, JSON.stringify(cities));
  } catch (error) {
    console.error('Error adding city to multiple cities:', error);
  }
};

/**
 * Removes a city from the multiple cities list
 * @param {string} locationCode - Location code of the city to remove
 */
export const removeCityFromMultipleCities = async (locationCode) => {
  try {
    const cities = await getMultipleCities();

    // Filter out the city to remove
    const updatedCities = cities.filter(city => city.locationCode !== locationCode);

    // Save updated list
    await AsyncStorage.setItem(MULTIPLE_CITIES_KEY, JSON.stringify(updatedCities));
  } catch (error) {
    console.error('Error removing city from multiple cities:', error);
  }
};

/**
 * Gets all cities in the multiple cities list
 * @returns {Promise<Array>} Array of cities
 */
export const getMultipleCities = async () => {
  try {
    const citiesJson = await AsyncStorage.getItem(MULTIPLE_CITIES_KEY);
    if (citiesJson) {
      return JSON.parse(citiesJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting multiple cities:', error);
    return [];
  }
};

/**
 * Gets prayer times for all cities in the list
 * @returns {Promise<Object>} Object with city data and prayer times
 */
export const getAllCitiesPrayerTimes = async () => {
  try {
    const cities = await getMultipleCities();
    const results = {};

    // Fetch prayer times for each city
    for (const city of cities) {
      try {
        const data = await fetchPrayerTimings(city.locationCode);
        const prayers = processPrayerData(data);

        results[city.locationCode] = {
          ...city,
          prayers,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error fetching prayer times for ${city.name}:`, error);
        results[city.locationCode] = {
          ...city,
          error: error.message,
          lastUpdated: new Date().toISOString()
        };
      }
    }

    return results;
  } catch (error) {
    console.error('Error getting all cities prayer times:', error);
    return {};
  }
};

/**
 * Clears all cities from the multiple cities list
 */
export const clearMultipleCities = async () => {
  try {
    await AsyncStorage.removeItem(MULTIPLE_CITIES_KEY);
  } catch (error) {
    console.error('Error clearing multiple cities:', error);
  }
};

/**
 * Checks if a city is in the multiple cities list
 * @param {string} locationCode - Location code of the city to check
 * @returns {Promise<boolean>} Whether the city is in the list
 */
export const isCityInMultipleCities = async (locationCode) => {
  try {
    const cities = await getMultipleCities();
    return cities.some(city => city.locationCode === locationCode);
  } catch (error) {
    console.error('Error checking if city is in multiple cities:', error);
    return false;
  }
};
