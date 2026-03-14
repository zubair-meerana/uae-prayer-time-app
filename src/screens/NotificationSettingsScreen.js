import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import {
  getNotificationSettings,
  saveNotificationSettings,
  registerForPushNotificationsAsync,
} from "../services/notificationService";
import * as Notifications from "expo-notifications";

// Only the 5 obligatory prayers (excluding Sunrise)
const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { t, language, isRTL } = useLanguage();
  const [allEnabled, setAllEnabled] = useState(true);
  const [settings, setSettings] = useState({});
  const [expandedPrayer, setExpandedPrayer] = useState(null);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await registerForPushNotificationsAsync();
    }
  };

  const loadSettings = async () => {
    const savedSettings = await getNotificationSettings();

    // Ensure all boolean values are actually booleans (not strings)
    const normalizedSettings = {};
    PRAYER_NAMES.forEach((prayer) => {
      const setting = savedSettings[prayer] || {};
      normalizedSettings[prayer] = {
        alarmEnabled: !!setting.alarmEnabled,
        reminderEnabled: !!setting.reminderEnabled,
        vibration: !!setting.vibration,
      };
    });

    setSettings(normalizedSettings);

    // Check if all prayers have alarms disabled
    const allDisabled = PRAYER_NAMES.every(
      (prayer) => !normalizedSettings[prayer]?.alarmEnabled,
    );
    setAllEnabled(!allDisabled);
  };

  const toggleAllNotifications = async (value) => {
    setAllEnabled(value);
    const newSettings = {};
    PRAYER_NAMES.forEach((prayer) => {
      newSettings[prayer] = {
        ...settings[prayer],
        alarmEnabled: value,
        reminderEnabled: value,
      };
    });
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
  };

  const toggleSetting = async (prayer, settingKey) => {
    const newSettings = {
      ...settings,
      [prayer]: {
        ...settings[prayer],
        [settingKey]: !settings[prayer]?.[settingKey],
      },
    };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
  };

  const togglePrayerExpansion = (prayer) => {
    if (expandedPrayer === prayer) {
      setExpandedPrayer(null);
    } else {
      setExpandedPrayer(prayer);
    }
  };

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("testNotificationTitle") || "Test Notification",
          body:
            t("testNotificationBody") ||
            "This is a test notification from UAE Prayer Times",
          sound: "default",
          data: { type: "test" },
          ...(Platform.OS === "android" && {
            channelId: "prayer-reminder",
          }),
        },
        trigger: null, // Fire immediately
      });
      Alert.alert(
        t("testSent") || "Test Sent",
        t("testNotificationSent") || "Check your notifications!",
      );
    } catch (error) {
      Alert.alert(
        t("error") || "Error",
        t("testNotificationFailed") || "Failed to send test notification",
      );
    }
  };

  const getPrayerIcon = (prayer) => {
    const icons = {
      Fajr: "sunny-outline",
      Sunrise: "sunny",
      Dhuhr: "partly-sunny",
      Asr: "cloudy",
      Maghrib: "moon-outline",
      Isha: "moon",
    };
    return icons[prayer] || "star-outline";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("notificationSettings") || "Notification Settings"}
        </Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate("NotificationHistory")}
        >
          <Ionicons name="time-outline" size={24} color="#00897B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Master Toggle */}
        <View style={styles.masterToggleCard}>
          <View style={styles.masterToggleRow}>
            <Ionicons
              name={allEnabled ? "notifications" : "notifications-off-outline"}
              size={28}
              color={allEnabled ? "#00897B" : "#9E9E9E"}
            />
            <Text style={styles.masterToggleText}>
              {t("enableAllNotifications") || "Enable All Notifications"}
            </Text>
          </View>
          <Switch
            value={allEnabled}
            onValueChange={toggleAllNotifications}
            trackColor={{ false: "#E0E0E0", true: "#00897B" }}
          />
        </View>

        {/* Prayer Settings */}
        <View style={styles.prayersSection}>
          <Text style={styles.sectionTitle}>
            {t("prayerNotifications") || "Prayer Notifications"}
          </Text>

          {PRAYER_NAMES.map((prayer) => {
            const prayerSettings = settings[prayer] || {
              reminderEnabled: true,
              alarmEnabled: true,
              vibration: true,
            };
            const isExpanded = expandedPrayer === prayer;

            return (
              <View key={prayer} style={styles.prayerCard}>
                <TouchableOpacity
                  style={styles.prayerCardHeader}
                  onPress={() => togglePrayerExpansion(prayer)}
                  activeOpacity={0.7}
                >
                  <View style={styles.prayerInfo}>
                    <Ionicons
                      name={getPrayerIcon(prayer)}
                      size={24}
                      color="#00897B"
                    />
                    <Text style={styles.prayerName}>
                      {t(prayer.toLowerCase()) || prayer}
                    </Text>
                  </View>
                  <View style={styles.prayerHeaderRight}>
                    <View style={styles.statusIndicators}>
                      {prayerSettings.alarmEnabled && (
                        <View style={styles.statusDot} />
                      )}
                      {prayerSettings.reminderEnabled && (
                        <View
                          style={[styles.statusDot, styles.statusDotReminder]}
                        />
                      )}
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#666"
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.prayerCardDetails}>
                    {/* Alarm Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Ionicons
                          name="alarm"
                          size={20}
                          color="#00897B"
                          style={styles.settingIcon}
                        />
                        <View>
                          <Text style={styles.settingLabel}>
                            {t("alarmAtPrayerTime") || "Alarm at Prayer Time"}
                          </Text>
                          <Text style={styles.settingDescription}>
                            {t("notifyExactlyAtPrayerTime") ||
                              "Notify exactly when prayer starts"}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={prayerSettings.alarmEnabled}
                        onValueChange={() =>
                          toggleSetting(prayer, "alarmEnabled")
                        }
                        trackColor={{ false: "#E0E0E0", true: "#00897B" }}
                      />
                    </View>

                    {/* Reminder Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#FF9800"
                          style={styles.settingIcon}
                        />
                        <View>
                          <Text style={styles.settingLabel}>
                            {t("reminderBeforePrayer") ||
                              "Reminder (2 min before)"}
                          </Text>
                          <Text style={styles.settingDescription}>
                            {t("notifyBeforePrayerTime") ||
                              "Get notified 2 minutes before"}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={prayerSettings.reminderEnabled}
                        onValueChange={() =>
                          toggleSetting(prayer, "reminderEnabled")
                        }
                        trackColor={{ false: "#E0E0E0", true: "#FF9800" }}
                      />
                    </View>

                    {/* Vibration Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Ionicons
                          name="phone-portrait-outline"
                          size={20}
                          color="#2196F3"
                          style={styles.settingIcon}
                        />
                        <View>
                          <Text style={styles.settingLabel}>
                            {t("vibration") || "Vibration"}
                          </Text>
                          <Text style={styles.settingDescription}>
                            {t("vibrateOnNotification") ||
                              "Vibrate when notified"}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={prayerSettings.vibration}
                        onValueChange={() => toggleSetting(prayer, "vibration")}
                        trackColor={{ false: "#E0E0E0", true: "#2196F3" }}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Test Notification Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={sendTestNotification}
          activeOpacity={0.7}
        >
          <Ionicons
            name="send"
            size={20}
            color="#FFFFFF"
            style={styles.testButtonIcon}
          />
          <Text style={styles.testButtonText}>
            {t("sendTestNotification") || "Send Test Notification"}
          </Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#00897B"
          />
          <Text style={styles.infoText}>
            {t("notificationInfo") ||
              "Notifications will fire even when the app is closed. Make sure to keep notifications enabled for accurate prayer time alerts."}
          </Text>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#004D40",
    textAlign: "center",
    flex: 1,
  },
  historyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  masterToggleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    margin: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  masterToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  masterToggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  prayersSection: {
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
    marginTop: 10,
  },
  prayerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  prayerCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  prayerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  prayerHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicators: {
    flexDirection: "row",
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00897B",
  },
  statusDotReminder: {
    backgroundColor: "#FF9800",
  },
  prayerCardDetails: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    padding: 15,
    paddingTop: 10,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    marginRight: 4,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  settingDescription: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  testButton: {
    flexDirection: "row",
    backgroundColor: "#00897B",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#00897B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  testButtonIcon: {
    marginRight: 10,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E0F2F1",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#00695C",
    lineHeight: 20,
  },
});
