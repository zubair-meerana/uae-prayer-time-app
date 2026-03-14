import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { getRecentPrayerTimes } from "../services/prayerHistoryService";

const PrayerTimeHistory = ({ visible, onClose, selectedEmirate }) => {
  const { t, isRTL } = useLanguage();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && selectedEmirate) {
      loadHistory();
    }
  }, [visible, selectedEmirate]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getRecentPrayerTimes(selectedEmirate, 7); // Last 7 days
      setHistoryData(data);
    } catch (error) {
      console.error("Error loading prayer time history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderPrayerItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.dateText}>{formatDate(item.date)}</Text>
      <View style={styles.prayersContainer}>
        {item.prayers.map((prayer, index) => (
          <View key={`${prayer.name}-${index}`} style={styles.prayerRow}>
            <Text style={styles.prayerName}>
              {t(prayer.name.toLowerCase())}
            </Text>
            <Text style={styles.prayerTime}>{prayer.time}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, isRTL && styles.rtlModalView]}>
          <Text style={styles.modalTitle}>{t("prayerTimeHistory")}</Text>

          {loading ? (
            <Text style={styles.loadingText}>{t("loading")}...</Text>
          ) : historyData.length > 0 ? (
            <FlatList
              data={historyData}
              renderItem={renderPrayerItem}
              keyExtractor={(item, index) => `${item.date}-${index}`}
              style={styles.historyList}
            />
          ) : (
            <Text style={styles.noDataText}>{t("noHistoricalData")}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={onClose}
          >
            <Text style={styles.textStyle}>{t("close")}</Text>
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
  historyList: {
    flex: 1,
    width: "100%",
  },
  historyItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00897B",
    marginBottom: 10,
    textAlign: "center",
  },
  prayersContainer: {
    flexDirection: "column",
  },
  prayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  prayerName: {
    fontSize: 14,
    color: "#333",
  },
  prayerTime: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  loadingText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
    color: "#666",
  },
  noDataText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
    color: "#999",
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    alignItems: "center",
    marginTop: 15,
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

export default PrayerTimeHistory;
