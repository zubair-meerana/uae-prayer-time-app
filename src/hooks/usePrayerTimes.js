import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
    fetchPrayerTimings,
    processPrayerData,
    getAvailableEmirates
} from '../services/prayerApi';
import { getNextPrayer } from '../utils/timeUtils';
import { schedulePrayerNotifications, storeRawDataForBackground } from '../services/notificationService';

export const usePrayerTimes = () => {
    // Default to Dubai if location detection fails
    const [selectedEmirate, setSelectedEmirate] = useState('dubai');
    const [prayerTimes, setPrayerTimes] = useState([]);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [displayDate, setDisplayDate] = useState(new Date());
    const [rawData, setRawData] = useState(null);
    // Track if user has manually selected a date to prevent auto-switching back/forth inappropriately
    const [manualOverride, setManualOverride] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationPermission, setLocationPermission] = useState(null);

    /**
     * 1. Attempt to detect user's current Emirate on mount.
     */
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setLocationPermission(status);

                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    // Reverse geocode to find city/region
                    const address = await Location.reverseGeocodeAsync({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    });

                    if (address && address.length > 0) {
                        const { city, region, subregion } = address[0];
                        const detectedName = (city || region || subregion || '').toLowerCase();

                        // Try to match detected name with our available emirates
                        const available = getAvailableEmirates();
                        const match = available.find(e => detectedName.includes(e.value) || detectedName.includes(e.label.toLowerCase()));

                        if (match) {
                            setSelectedEmirate(match.value);
                        }
                    }
                }
            } catch (err) {
                console.log('Location detection failed, defaulting to Dubai', err);
            }
        })();
    }, []);

    /**
     * 2. Fetch data whenever selectedEmirate changes.
     */
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPrayerTimings(selectedEmirate);
            setRawData(data); // Store raw data for switching dates

            // Initial load always tries to show "Today" first, then we update if needed
            const now = new Date();
            const processedPrayers = processPrayerData(data, now);
            setPrayerTimes(processedPrayers);
            setDisplayDate(now);

            // Calculate next prayer
            const next = getNextPrayer(processedPrayers);
            setNextPrayer(next);

            // If next prayer is tomorrow, and we haven't manually overridden, switch view to tomorrow
            if (next && next.isTomorrow && !manualOverride) {
                const tomorrow = new Date();
                tomorrow.setDate(now.getDate() + 1);

                setDisplayDate(tomorrow);
                const tomorrowPrayers = processPrayerData(data, tomorrow);
                setPrayerTimes(tomorrowPrayers);
            }

            // Store for background task
            storeRawDataForBackground(data);

            // Schedule notifications for ONLY the next upcoming prayer
            schedulePrayerNotifications(processedPrayers);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedEmirate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /**
     * 3. Update "Next Prayer" highlight every minute to keep UI fresh.
     */
    /**
     * 3. Update "Next Prayer" highlight every minute to keep UI fresh.
     * Also checks if we need to auto-switch to tomorrow.
     */
    useEffect(() => {
        const interval = setInterval(() => {
            if (rawData) {
                // Re-evaluate "Now" against "Today's" prayers to see if we moved to tomorrow
                const now = new Date();

                // Always check against TODAY'S data to decide transition
                const todayPrayers = processPrayerData(rawData, now);
                const next = getNextPrayer(todayPrayers);
                setNextPrayer(next); // Keep this updated for banner

                if (next && next.isTomorrow && !manualOverride) {
                    // Auto-switch to tomorrow if not already
                    const tomorrow = new Date();
                    tomorrow.setDate(now.getDate() + 1);

                    // Only update if displayDate is not already tomorrow
                    if (displayDate.getDate() !== tomorrow.getDate()) {
                        setDisplayDate(tomorrow);
                        const tomorrowPrayers = processPrayerData(rawData, tomorrow);
                        setPrayerTimes(tomorrowPrayers);
                    }
                }
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [rawData, manualOverride, displayDate]);

    // Helper to switch dates manually
    const toggleDate = useCallback(() => {
        if (!rawData) return;

        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);

        const isCurrentlyToday = displayDate.getDate() === now.getDate();
        const newDate = isCurrentlyToday ? tomorrow : now;

        setManualOverride(true); // User took control
        setDisplayDate(newDate);
        setPrayerTimes(processPrayerData(rawData, newDate));
    }, [displayDate, rawData]);

    return {
        selectedEmirate,
        setSelectedEmirate,
        prayerTimes,
        nextPrayer,
        loading,
        error,
        refreshParams: loadData,
        availableEmirates: getAvailableEmirates(),
        displayDate,
        toggleDate,
        isDisplayingTomorrow: displayDate.getDate() !== new Date().getDate()
    };
};
