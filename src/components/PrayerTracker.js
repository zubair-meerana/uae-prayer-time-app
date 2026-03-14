import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { markPrayerPerformed, getPrayerTrackingForDate } from '../services/prayerTrackingService';

const PrayerTracker = ({ selectedEmirate, currentDate = new Date() }) => {
  const { t, isRTL } = useLanguage();
  const [prayerStatus, setPrayerStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  useEffect(() => {
    loadPrayerStatus();
  }, [selectedEmirate, currentDate]);

  const loadPrayerStatus = async () => {
    setLoading(true);
    try {
      const tracking = await getPrayerTrackingForDate(selectedEmirate, currentDate);
      setPrayerStatus(tracking);
    } catch (error) {
      console.error('Error loading prayer status:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrayerStatus = async (prayerName) => {
    const newStatus = !prayerStatus[prayerName]?.performed;

    // Update local state immediately for responsiveness
    setPrayerStatus(prev => ({
      ...prev,
      [prayerName]: {
        performed: newStatus,
        timestamp: new Date().toISOString()
      }
    }));

    // Save to storage
    await markPrayerPerformed(selectedEmirate, currentDate, prayerName, newStatus);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={[styles.container, isRTL && styles.rtlContainer]}>
        <Text style={styles.loadingText}>{t('loading')}...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Text style={styles.title}>{t('prayerTracker')}</Text>
      <Text style={styles.dateText}>{formatDate(currentDate)}</Text>

      {prayerNames.map((prayerName) => (
        <TouchableOpacity
          key={prayerName}
          style={styles.prayerItem}
          onPress={() => togglePrayerStatus(prayerName)}
        >
          <Text style={styles.prayerName}>{t(`prayers.${prayerName}`)}</Text>
          <View style={styles.switchContainer}>
            <Text style={[
              styles.statusText,
              { color: prayerStatus[prayerName]?.performed ? '#4CAF50' : '#999' }
            ]}>
              {prayerStatus[prayerName]?.performed ? t('performed') : t('notPerformed')}
            </Text>
            <Switch
              value={prayerStatus[prayerName]?.performed || false}
              onValueChange={() => togglePrayerStatus(prayerName)}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={prayerStatus[prayerName]?.performed ? "#4CAF50" : "#f4f3f4"}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rtlContainer: {
    // Any RTL specific styling
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00897B',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  prayerName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginRight: 8,
    minWidth: 60,
    textAlign: 'right',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default PrayerTracker;
