import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { formatTo12Hour } from "../utils/timeUtils";

const PrayerItem = ({ name, time, isNext }) => {
  const { t, isRTL } = useLanguage();

  // "name" might be "Fajr", "Dhuhr", etc.
  // We use that key to lookup the translation: t(name.toLowerCase())
  const displayName = t(name.toLowerCase()) || name;

  return (
    <View
      style={[
        styles.container,
        isNext && styles.highlightContainer,
        isRTL && styles.rtlContainer,
      ]}
    >
      <View style={[styles.content, isRTL && styles.rtlContent]}>
        <Text style={[styles.name, isNext && styles.highlightText]}>
          {displayName}
        </Text>
        <Text style={[styles.time, isNext && styles.highlightText]}>
          {formatTo12Hour(time)}
        </Text>
      </View>
      {isNext && (
        <View style={styles.indicatorWrapper}>
          <Text style={styles.nextLabel}>{t("next")}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  rtlContainer: {
    // When RTL, we might want to flip direction of current children
    flexDirection: "row-reverse",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rtlContent: {
    flexDirection: "row-reverse",
  },
  highlightContainer: {
    backgroundColor: "#E0F2F1",
    borderColor: "#00897B",
    transform: [{ scale: 1.02 }],
  },
  name: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  time: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  highlightText: {
    color: "#00695C", // Darker teal
    fontWeight: "700",
  },
  indicatorWrapper: {
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: "#00897B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextLabel: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default PrayerItem;
