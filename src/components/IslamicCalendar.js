import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { getCurrentHijriDate as calculateLocalHijriDate } from "../utils/islamicCalendarUtils";

const IslamicCalendar = () => {
  const { t, language, isRTL } = useLanguage();
  const { getCurrentHijriDate, prayerTimes } = usePrayerTimes();
  const [hijriDate, setHijriDate] = useState(null);

  useEffect(() => {
    const loadHijriDate = () => {
      // First try to get hijri date from API data
      let hijri = getCurrentHijriDate();

      // If API data is not available, calculate locally
      if (!hijri) {
        hijri = calculateLocalHijriDate();
      }

      setHijriDate(hijri);
    };

    loadHijriDate();

    // Update every hour to ensure accuracy
    const interval = setInterval(loadHijriDate, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]); // Re-run when prayerTimes changes

  const formatHijriDate = (hijri) => {
    if (!hijri) return "";

    // Format as "Day Month Year" (e.g., "15 Shaban 1447")
    return `${hijri.day} ${hijri.month} ${hijri.year}`;
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <View style={styles.calendarHeader}>
        <Text style={styles.title}>{t("islamicDate")}</Text>
      </View>

      <View style={styles.dateDisplay}>
        {hijriDate ? (
          <Text style={styles.hijriDate}>{formatHijriDate(hijriDate)}</Text>
        ) : (
          <Text style={styles.loadingText}>{t("loading")}...</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  rtlContainer: {
    // Any RTL specific styling
  },
  calendarHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00897B",
  },
  dateDisplay: {
    alignItems: "center",
  },
  hijriDate: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default IslamicCalendar;
