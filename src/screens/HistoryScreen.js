import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";
import { getPrayerTracking } from "../services/prayerTrackingService";
import DateTimePicker from "@react-native-community/datetimepicker";

// Only the 5 obligatory prayers (excluding Sunrise)
const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Helper to check if a date is Friday
const isFriday = (date) => {
  return date.getDay() === 5; // 5 = Friday in JavaScript (0 = Sunday)
};

// Get prayer names for a specific date (replaces Dhuhr with Jumu'ah on Fridays)
const getPrayerNamesForDate = (date, t) => {
  if (isFriday(date)) {
    return [
      { key: "Fajr", label: t("fajr") || "Fajr" },
      { key: "Jumu'ah", label: t("jumah") || "Jumu'ah" },
      { key: "Asr", label: t("asr") || "Asr" },
      { key: "Maghrib", label: t("maghrib") || "Maghrib" },
      { key: "Isha", label: t("isha") || "Isha" },
    ];
  }
  return PRAYER_NAMES.map((prayer) => ({
    key: prayer,
    label: t(prayer.toLowerCase()) || prayer,
  }));
};

export default function HistoryScreen() {
  const { t, language, isRTL } = useLanguage();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [trackingData, setTrackingData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrackingData();
  }, [startDate, endDate]);

  const loadTrackingData = async () => {
    setLoading(true);
    try {
      const allTracking = await getPrayerTracking();
      const rangeData = {};

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = formatDateKey(currentDate);
        const dateTracking = {};

        Object.keys(allTracking).forEach((emirate) => {
          if (allTracking[emirate][dateKey]) {
            dateTracking[emirate] = allTracking[emirate][dateKey];
          }
        });

        if (Object.keys(dateTracking).length > 0) {
          rangeData[dateKey] = dateTracking;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setTrackingData(rangeData);
    } catch (error) {
      console.error("Error loading tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowStartDatePicker(false);
    }
    if (date) {
      setStartDate(date);
      if (date > endDate) {
        setEndDate(date);
      }
    }
  };

  const handleEndDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowEndDatePicker(false);
    }
    if (date) {
      setEndDate(date);
    }
  };

  const formatDateDisplay = (date) => {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString(
      language === "en" ? "en-US" : "ar-AE",
      options,
    );
  };

  const getDatesInRange = (start, end) => {
    const dates = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const calculatePrayerStats = (dayTracking) => {
    let performed = 0;
    let total = 0;

    Object.values(dayTracking).forEach((emirateTracking) => {
      PRAYER_NAMES.forEach((prayer) => {
        if (emirateTracking[prayer]) {
          total++;
          if (emirateTracking[prayer].performed) {
            performed++;
          }
        }
      });
    });

    return { performed, total };
  };

  const datesInRange = getDatesInRange(startDate, endDate);
  const hasData = datesInRange.some((date) => {
    const dateKey = formatDateKey(date);
    return (
      trackingData[dateKey] && Object.keys(trackingData[dateKey]).length > 0
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("prayerHistory") || "Prayer History"}
        </Text>
      </View>

      {/* Date Range Picker */}
      <View style={styles.datePickerSection}>
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#00695C" />
            <Text style={styles.dateButtonText}>
              {t("from") || "From"}: {formatDateDisplay(startDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#00695C" />
            <Text style={styles.dateButtonText}>
              {t("to") || "To"}: {formatDateDisplay(endDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleStartDateChange}
            maximumDate={new Date()}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleEndDateChange}
            maximumDate={new Date()}
            minimumDate={startDate}
          />
        )}
      </View>

      {/* History Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {t("loading") || "Loading..."}
            </Text>
          </View>
        ) : !hasData ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="clipboard-outline" size={64} color="#CCC" />
            <Text style={styles.noDataText}>
              {t("noPrayerTrackingData") || "No prayer tracking data available"}
            </Text>
            <Text style={styles.noDataSubtext}>
              {t("markPrayersFromHome") ||
                "Mark prayers as performed from the Home page"}
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {datesInRange.map((date) => {
              const dateKey = formatDateKey(date);
              const dayTracking = trackingData[dateKey];

              if (!dayTracking || Object.keys(dayTracking).length === 0) {
                return null;
              }

              const stats = calculatePrayerStats(dayTracking);

              return (
                <View key={dateKey} style={styles.dayCard}>
                  <View style={styles.dayCardHeader}>
                    <Text style={styles.dayDate}>
                      {formatDateDisplay(date)}
                    </Text>
                    <View
                      style={[
                        styles.statsBadge,
                        stats.performed === stats.total && stats.total > 0
                          ? styles.fullStatsBadge
                          : stats.performed > 0
                            ? styles.partialStatsBadge
                            : styles.emptyStatsBadge,
                      ]}
                    >
                      <Text style={styles.statsBadgeText}>
                        {stats.performed}/{stats.total}
                      </Text>
                    </View>
                  </View>

                  {Object.entries(dayTracking).map(([emirate, prayers]) => (
                    <View key={emirate} style={styles.emirateSection}>
                      <Text style={styles.emirateName}>{emirate}</Text>
                      <View style={styles.prayerList}>
                        {getPrayerNamesForDate(date, t).map(
                          ({ key, label }) => {
                            // Map Jumu'ah back to Dhuhr for data lookup
                            const dataKey = key === "Jumu'ah" ? "Dhuhr" : key;
                            const prayerData = prayers[dataKey];
                            if (!prayerData) return null;

                            return (
                              <View key={key} style={styles.prayerRow}>
                                <View style={styles.prayerInfo}>
                                  <View
                                    style={[
                                      styles.prayerDot,
                                      prayerData.performed
                                        ? styles.performedDot
                                        : styles.missedDot,
                                    ]}
                                  />
                                  <Text style={styles.prayerName}>{label}</Text>
                                </View>
                                <Text
                                  style={[
                                    styles.statusText,
                                    prayerData.performed
                                      ? styles.performedText
                                      : styles.missedText,
                                  ]}
                                >
                                  {prayerData.performed
                                    ? t("performed") || "Performed"
                                    : t("notPerformed") || "Not Performed"}
                                </Text>
                              </View>
                            );
                          },
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004D40",
    textAlign: "center",
  },
  datePickerSection: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateRangeContainer: {
    flexDirection: "column",
    gap: 10,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#E0F2F1",
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#00695C",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  noDataContainer: {
    padding: 60,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  historyList: {
    gap: 15,
  },
  dayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#004D40",
  },
  statsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fullStatsBadge: {
    backgroundColor: "#4CAF50",
  },
  partialStatsBadge: {
    backgroundColor: "#FF9800",
  },
  emptyStatsBadge: {
    backgroundColor: "#F44336",
  },
  statsBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  emirateSection: {
    marginTop: 12,
  },
  emirateName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00897B",
    marginBottom: 8,
  },
  prayerList: {
    gap: 8,
  },
  prayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
  },
  prayerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  prayerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  performedDot: {
    backgroundColor: "#4CAF50",
  },
  missedDot: {
    backgroundColor: "#F44336",
  },
  prayerName: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  performedText: {
    color: "#4CAF50",
  },
  missedText: {
    color: "#F44336",
  },
});
