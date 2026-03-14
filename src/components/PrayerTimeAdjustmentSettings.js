import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Slider,
  Switch,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";

const PrayerTimeAdjustmentSettings = ({
  visible,
  onClose,
  prayerTimeAdjustments,
  setPrayerTimeAdjustments,
  enableAdjustments,
  setEnableAdjustments,
}) => {
  const { t, isRTL } = useLanguage();

  const prayerNames = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

  const handleAdjustmentChange = (prayerName, value) => {
    setPrayerTimeAdjustments((prev) => ({
      ...prev,
      [prayerName]: value,
    }));
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, isRTL && styles.rtlModalView]}>
          <Text style={styles.modalTitle}>{t("adjustPrayerTimes")}</Text>

          <View style={styles.adjustmentToggleContainer}>
            <Text style={styles.toggleLabel}>{t("enableAdjustments")}</Text>
            <Switch
              value={enableAdjustments}
              onValueChange={setEnableAdjustments}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={enableAdjustments ? "#00897B" : "#f4f3f4"}
            />
          </View>

          {enableAdjustments && (
            <View style={styles.adjustmentsContainer}>
              {prayerNames.map((prayerName) => (
                <View key={prayerName} style={styles.sliderContainer}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>
                      {t(prayerName.toLowerCase())}
                    </Text>
                    <Text style={styles.sliderValue}>
                      {prayerTimeAdjustments[prayerName] > 0 ? "+" : ""}
                      {prayerTimeAdjustments[prayerName]} {t("minutes")}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={-60}
                    maximumValue={60}
                    step={5}
                    value={prayerTimeAdjustments[prayerName] || 0}
                    onValueChange={(value) =>
                      handleAdjustmentChange(prayerName, value)
                    }
                    minimumTrackTintColor="#00897B"
                    maximumTrackTintColor="#d3d3d3"
                    thumbStyle={styles.thumb}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelSmall}>{t("earlier")}</Text>
                    <Text style={styles.sliderLabelSmall}>{t("later")}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={onClose}
          >
            <Text style={styles.textStyle}>{t("done")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  rtlModalView: {
    // Any RTL specific styling
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#00897B",
  },
  adjustmentToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  adjustmentsContainer: {
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  sliderValue: {
    fontSize: 14,
    color: "#00897B",
    fontWeight: "600",
  },
  slider: {
    height: 40,
    marginVertical: 5,
  },
  thumb: {
    backgroundColor: "#00897B",
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  sliderLabelSmall: {
    fontSize: 12,
    color: "#666",
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    alignItems: "center",
  },
  buttonClose: {
    backgroundColor: "#00897B",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default PrayerTimeAdjustmentSettings;
