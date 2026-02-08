import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const NotificationSettings = ({
  visible,
  onClose,
  notificationSettings,
  setNotificationSettings
}) => {
  const { t, isRTL } = useLanguage();

  const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  const handleSettingChange = (prayerName, setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [prayerName]: {
        ...prev[prayerName],
        [setting]: value
      }
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
          <Text style={styles.modalTitle}>{t('notificationSettings')}</Text>

          <ScrollView style={styles.settingsContainer}>
            {prayerNames.map((prayerName) => (
              <View key={prayerName} style={styles.prayerSettingsContainer}>
                <Text style={styles.prayerTitle}>
                  {t(`prayers.${prayerName}`)}
                </Text>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t('enableReminder')}</Text>
                  <Switch
                    value={notificationSettings[prayerName]?.reminderEnabled ?? true}
                    onValueChange={(value) => handleSettingChange(prayerName, 'reminderEnabled', value)}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={notificationSettings[prayerName]?.reminderEnabled ? "#00897B" : "#f4f3f4"}
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t('enableAlarm')}</Text>
                  <Switch
                    value={notificationSettings[prayerName]?.alarmEnabled ?? true}
                    onValueChange={(value) => handleSettingChange(prayerName, 'alarmEnabled', value)}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={notificationSettings[prayerName]?.alarmEnabled ? "#00897B" : "#f4f3f4"}
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t('vibration')}</Text>
                  <Switch
                    value={notificationSettings[prayerName]?.vibration ?? true}
                    onValueChange={(value) => handleSettingChange(prayerName, 'vibration', value)}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={notificationSettings[prayerName]?.vibration ? "#00897B" : "#f4f3f4"}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={onClose}
          >
            <Text style={styles.textStyle}>{t('done')}</Text>
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
    width: '90%',
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
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
  settingsContainer: {
    flex: 1,
    width: '100%',
  },
  prayerSettingsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#00897B',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonClose: {
    backgroundColor: "#00897B",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
});

export default NotificationSettings;
