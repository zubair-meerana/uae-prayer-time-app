import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
    fetchPrayerTimings,
    processPrayerData,
    getAvailableEmirates
} from '../services/prayerApi';
import { getNextPrayer } from '../utils/timeUtils';
import { schedulePrayerNotifications } from '../services/notificationService';

export const usePrayerTimes = () => {
    // Default to Dubai if location detection fails
    const [selectedEmirate, setSelectedEmirate] = useState('dubai');
    const [prayerTimes, setPrayerTimes] = useState([]);
    const [nextPrayer, setNextPrayer] = useState(null);
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
            const processedPrayers = processPrayerData(data);
            setPrayerTimes(processedPrayers);

            // Calculate next prayer immediately
            const next = getNextPrayer(processedPrayers);
            setNextPrayer(next);

            // Schedule notifications for these new times
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
    useEffect(() => {
        const interval = setInterval(() => {
            if (prayerTimes.length > 0) {
                const next = getNextPrayer(prayerTimes);
                setNextPrayer(next);
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [prayerTimes]);

    return {
        selectedEmirate,
        setSelectedEmirate,
        prayerTimes,
        nextPrayer,
        loading,
        error,
        refreshParams: loadData,
        availableEmirates: getAvailableEmirates(),
    };
};
