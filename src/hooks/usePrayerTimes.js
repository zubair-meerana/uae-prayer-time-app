import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import * as BackgroundTask from "expo-background-task";
import {
  fetchPrayerTimings,
  processPrayerData,
  getAvailableEmirates,
} from "../services/prayerApi";
import { getNextPrayer } from "../utils/timeUtils";
import {
  schedulePrayerNotifications,
  storeRawDataForBackground,
} from "../services/notificationService";
import {
  determineEmirateFromCoordinates,
  getClosestEmirate,
  isLocationInUAE,
} from "../utils/locationUtils";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { addPrayerTimeToHistory } from "../services/prayerHistoryService";
import { preScheduleMonthlyPrayerNotifications } from "../services/notificationService";

export const usePrayerTimes = () => {
  // Default to Dubai if location detection fails
  const [selectedEmirate, setSelectedEmirate] = useState("dubai");
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [rawData, setRawData] = useState(null);
  // Track if user has manually selected a date to prevent auto-switching back/forth inappropriately
  const [manualOverride, setManualOverride] = useState(false);
  const [locationManualOverride, setLocationManualOverride] = useState(false); // Track if user manually selected location
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);

  /**
   * 1. Attempt to detect user's current Emirate on mount.
   */
  useEffect(() => {
    (async () => {
      try {
        // Only perform automatic location detection if user hasn't manually selected location
        if (!locationManualOverride) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          setLocationPermission(status);

          if (status === "granted") {
            const location = await Location.getCurrentPositionAsync({});

            // Use precise coordinate-based detection first
            const { latitude, longitude } = location.coords;

            if (isLocationInUAE(latitude, longitude)) {
              const emirateByCoords = determineEmirateFromCoordinates(
                latitude,
                longitude,
              );

              if (emirateByCoords) {
                setSelectedEmirate(emirateByCoords);
              } else {
                // Fallback to closest emirate if not in defined boundaries
                const closestEmirate = getClosestEmirate(latitude, longitude);
                if (closestEmirate) {
                  setSelectedEmirate(closestEmirate);
                }
              }
            } else {
              // If not in UAE, use reverse geocoding as fallback
              const address = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              if (address && address.length > 0) {
                const { city, region, subregion } = address[0];
                const detectedName = (
                  city ||
                  region ||
                  subregion ||
                  ""
                ).toLowerCase();

                // Try to match detected name with our available emirates
                const available = getAvailableEmirates();
                const match = available.find(
                  (e) =>
                    detectedName.includes(e.value) ||
                    detectedName.includes(e.label.toLowerCase()),
                );

                if (match) {
                  setSelectedEmirate(match.value);
                }
              }
            }
          }
        }
      } catch (err) {
        console.log("Location detection failed, defaulting to Dubai", err);
      }
    })();
  }, [locationManualOverride]); // Add locationManualOverride to dependency array

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
      let processedPrayers = processPrayerData(data, now);

      // Apply prayer time adjustments if enabled
      processedPrayers = applyPrayerTimeAdjustments(processedPrayers);

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
        let tomorrowPrayers = processPrayerData(data, tomorrow);
        tomorrowPrayers = applyPrayerTimeAdjustments(tomorrowPrayers);
        setPrayerTimes(tomorrowPrayers);
      }

      // Store for background task
      storeRawDataForBackground(data);

      // Pre-schedule all monthly prayer notifications to ensure they fire even when app is closed
      await preScheduleMonthlyPrayerNotifications(data, selectedEmirate);

      // Save to history
      await addPrayerTimeToHistory(selectedEmirate, now, processedPrayers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedEmirate, applyPrayerTimeAdjustments]);

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
        let todayPrayers = processPrayerData(rawData, now);
        // Apply prayer time adjustments if enabled
        todayPrayers = applyPrayerTimeAdjustments(todayPrayers);

        const next = getNextPrayer(todayPrayers);
        setNextPrayer(next); // Keep this updated for banner

        if (next && next.isTomorrow && !manualOverride) {
          // Auto-switch to tomorrow if not already
          const tomorrow = new Date();
          tomorrow.setDate(now.getDate() + 1);

          // Only update if displayDate is not already tomorrow
          if (displayDate.getDate() !== tomorrow.getDate()) {
            setDisplayDate(tomorrow);
            let tomorrowPrayers = processPrayerData(rawData, tomorrow);
            tomorrowPrayers = applyPrayerTimeAdjustments(tomorrowPrayers);
            setPrayerTimes(tomorrowPrayers);
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [rawData, manualOverride, displayDate, applyPrayerTimeAdjustments]);

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
    let prayers = processPrayerData(rawData, newDate);
    prayers = applyPrayerTimeAdjustments(prayers);
    setPrayerTimes(prayers);
  }, [displayDate, rawData, applyPrayerTimeAdjustments]);

  // Prayer time adjustments state
  const [prayerTimeAdjustments, setPrayerTimeAdjustments] = useState({
    Fajr: 0,
    Sunrise: 0,
    Dhuhr: 0,
    Asr: 0,
    Maghrib: 0,
    Isha: 0,
  });

  const [enableAdjustments, setEnableAdjustments] = useState(false);

  // Function to handle manual emirate selection
  const handleManualEmirateSelection = (emirate) => {
    setSelectedEmirate(emirate);
    setLocationManualOverride(true); // Mark that user manually selected location
  };

  // Function to apply prayer time adjustments
  const applyPrayerTimeAdjustments = (originalPrayers) => {
    if (!enableAdjustments) return originalPrayers;

    return originalPrayers.map((prayer) => {
      const adjustment = prayerTimeAdjustments[prayer.name] || 0;
      if (adjustment === 0) return prayer;

      // Parse the original time
      const [time, period] = prayer.time.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      // Convert to 24-hour format if needed
      if (period) {
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
      }

      // Apply adjustment in minutes
      const totalMinutes = hours * 60 + minutes + adjustment;
      let adjustedHours = Math.floor(totalMinutes / 60);
      let adjustedMinutes = totalMinutes % 60;

      // Handle day overflow
      let dayOffset = 0;
      if (adjustedHours >= 24) {
        adjustedHours -= 24;
        dayOffset = 1;
      } else if (adjustedHours < 0) {
        adjustedHours += 24;
        dayOffset = -1;
      }

      // Convert back to 12-hour format if original was 12-hour
      let formattedTime;
      if (period) {
        const newPeriod = adjustedHours >= 12 ? "PM" : "AM";
        let displayHours = adjustedHours % 12;
        if (displayHours === 0) displayHours = 12;
        formattedTime = `${displayHours}:${adjustedMinutes.toString().padStart(2, "0")} ${newPeriod}`;
      } else {
        formattedTime = `${adjustedHours.toString().padStart(2, "0")}:${adjustedMinutes.toString().padStart(2, "0")}`;
      }

      return {
        ...prayer,
        time: formattedTime,
        adjusted: true, // Flag to indicate this time was adjusted
        originalTime: prayer.time, // Keep original time for reference
        dayOffset: dayOffset, // For handling day transitions
      };
    });
  };

  return {
    selectedEmirate,
    setSelectedEmirate: handleManualEmirateSelection,
    prayerTimes,
    nextPrayer,
    loading,
    error,
    refreshParams: loadData,
    availableEmirates: getAvailableEmirates(),
    displayDate,
    toggleDate,
    isDisplayingTomorrow: displayDate.getDate() !== new Date().getDate(),
    locationManualOverride,
    prayerTimeAdjustments,
    setPrayerTimeAdjustments,
    enableAdjustments,
    setEnableAdjustments,
    applyPrayerTimeAdjustments,
    triggerTestAlarm,
    getCurrentHijriDate,
  };

  // Function to get current Hijri date from the API data
  const getCurrentHijriDate = () => {
    if (!rawData) return null;

    const todayData = processPrayerData(rawData, new Date());
    return todayData.hijri || null;
  };

  // Function to trigger a test alarm in 5 seconds
  const triggerTestAlarm = async () => {
    try {
      // Cancel any existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule a test notification for 5 seconds from now
      const testTime = new Date(Date.now() + 5000); // 5 seconds from now

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🕌 Test Prayer Alarm",
          body: "This is a test alarm to verify notification functionality",
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: true,
          autoDismiss: false,
          data: { prayerName: "Test", type: "test" },
          ...(Platform.OS === "android" && {
            channelId: "prayer-alarm",
            vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
            category: "alarm",
            interruptionFilter: "priority",
            lockScreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
            fullScreenIntent: true,
          }),
        },
        trigger: {
          date: testTime,
        },
      });

      console.log("Test alarm scheduled for:", testTime.toLocaleTimeString());
    } catch (error) {
      console.error("Error scheduling test alarm:", error);
    }
  };
};
