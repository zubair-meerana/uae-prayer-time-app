import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import {
  getNotificationHistory,
  clearNotificationHistory,
} from "../services/notificationHistoryService";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function NotificationHistoryScreen() {
  const navigation = useNavigation();
  const { t, language, isRTL } = useLanguage();
  const [history, setHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const data = await getNotificationHistory();
    setHistory(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setFilterDate(date);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      t("clearHistory") || "Clear History",
      t("clearHistoryConfirm") ||
        "Are you sure you want to clear all notification history?",
      [
        { text: t("cancel") || "Cancel", style: "cancel" },
        {
          text: t("clear") || "Clear",
          style: "destructive",
          onPress: async () => {
            await clearNotificationHistory();
            loadHistory();
          },
        },
      ],
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString(
      language === "en" ? "en-US" : "ar-AE",
      options,
    );
  };

  const getNotificationIcon = (type) => {
    if (type === "alarm") {
      return { name: "notifications", color: "#00897B" };
    } else if (type === "reminder") {
      return { name: "time-outline", color: "#FF9800" };
    }
    return { name: "information-circle-outline", color: "#666" };
  };

  const getFilteredHistory = () => {
    if (!filterDate) return history;

    const filterDateStr = filterDate.toISOString().split("T")[0];
    return history.filter((item) => {
      const itemDate = item.timestamp.split("T")[0];
      return itemDate === filterDateStr;
    });
  };

  const filteredHistory = getFilteredHistory();

  const groupByDate = (items) => {
    const groups = {};
    items.forEach((item) => {
      const date = item.timestamp.split("T")[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    return groups;
  };

  const groupedHistory = groupByDate(filteredHistory);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#004D40" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {t("notificationHistory") || "Notification History"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter and Actions */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#00897B" />
          <Text style={styles.filterButtonText}>
            {filterDate
              ? formatDate(filterDate.toISOString()).split(",")[0]
              : t("allDates") || "All Dates"}
          </Text>
        </TouchableOpacity>

        {filterDate && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => setFilterDate(null)}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={loadHistory}>
          <Ionicons name="refresh-outline" size={20} color="#00897B" />
        </TouchableOpacity>

        {history.length > 0 && (
          <TouchableOpacity
            style={styles.clearHistoryButton}
            onPress={clearHistory}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* History List */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {t("loading") || "Loading..."}
            </Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>
              {filterDate
                ? t("noNotificationsForDate") ||
                  "No notifications for this date"
                : t("noNotifications") || "No notification history yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {t("notificationsWillAppearHere") ||
                "Prayer notifications will appear here once scheduled"}
            </Text>
          </View>
        ) : (
          Object.entries(groupedHistory).map(([date, items]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>
                {new Date(date).toLocaleDateString(
                  language === "en" ? "en-US" : "ar-AE",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </Text>
              {items.map((item) => {
                const iconConfig = getNotificationIcon(item.type);
                return (
                  <View key={item.id} style={styles.notificationItem}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${iconConfig.color}20` },
                      ]}
                    >
                      <Ionicons
                        name={iconConfig.name}
                        size={24}
                        color={iconConfig.color}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View style={styles.itemMeta}>
                        <Text style={styles.itemTime}>
                          {formatDate(item.timestamp)}
                        </Text>
                        <View style={styles.typeBadge}>
                          <Text
                            style={[
                              styles.typeBadgeText,
                              item.type === "alarm" && styles.alarmBadge,
                              item.type === "reminder" && styles.reminderBadge,
                            ]}
                          >
                            {item.type === "alarm"
                              ? t("alarm") || "Alarm"
                              : t("reminder") || "Reminder"}
                          </Text>
                        </View>
                      </View>
                      {item.prayerName && (
                        <Text style={styles.prayerName}>
                          {t(item.prayerName.toLowerCase()) || item.prayerName}
                        </Text>
                      )}
                    </View>
                    <View style={styles.statusIndicator}>
                      <View
                        style={[
                          styles.statusDot,
                          item.status === "scheduled" && styles.scheduledDot,
                          item.status === "sent" && styles.sentDot,
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ))
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
    paddingTop: Platform.OS === "android" ? 40 : 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#004D40",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
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
    gap: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#00897B",
    fontWeight: "600",
  },
  clearFilterButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 4,
  },
  clearHistoryButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "bold",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  dateGroup: {
    marginVertical: 8,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  itemTime: {
    fontSize: 12,
    color: "#999",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#666",
  },
  alarmBadge: {
    backgroundColor: "#00897B20",
    color: "#00897B",
  },
  reminderBadge: {
    backgroundColor: "#FF980020",
    color: "#FF9800",
  },
  prayerName: {
    fontSize: 13,
    color: "#00897B",
    fontWeight: "bold",
    marginTop: 2,
  },
  statusIndicator: {
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CCC",
  },
  scheduledDot: {
    backgroundColor: "#2196F3",
  },
  sentDot: {
    backgroundColor: "#4CAF50",
  },
});
