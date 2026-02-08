import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { parseTime, formatRemainingTime } from '../utils/timeUtils';

const VisualPrayerCountdown = ({ nextPrayerData, prayers }) => {
  const { t, isRTL } = useLanguage();
  const [countdown, setCountdown] = useState('');
  const [progress, setProgress] = useState(new Animated.Value(0));
  const [timeUntilNext, setTimeUntilNext] = useState(0);

  useEffect(() => {
    if (!nextPrayerData || !nextPrayerData.nextPrayer) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const targetTime = parseTime(nextPrayerData.nextPrayer.time);
      if (nextPrayerData.isTomorrow) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const now = new Date();
      const diffMs = targetTime - now;

      if (diffMs > 0) {
        setTimeUntilNext(diffMs);
        setCountdown(formatRemainingTime(diffMs, t));

        // Calculate progress percentage (based on 24 hours)
        const totalDayMs = 24 * 60 * 60 * 1000;
        const progressPercentage = ((totalDayMs - diffMs) / totalDayMs) * 100;

        Animated.timing(progress, {
          toValue: progressPercentage,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      } else {
        setCountdown(t('now'));
        setProgress(new Animated.Value(100)); // Completed
      }
    };

    // Update immediately
    updateCountdown();

    // Update every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [nextPrayerData, t, progress]);

  if (!nextPrayerData || !nextPrayerData.nextPrayer) {
    return null;
  }

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <View style={styles.countdownHeader}>
        <Text style={styles.countdownTitle}>
          {t('nextPrayer')}: {t(`prayers.${nextPrayerData.nextPrayer.name}`)}
        </Text>
      </View>

      <View style={styles.countdownBody}>
        <Text style={styles.countdownText}>{countdown || t('now')}</Text>

        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: `${progress.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }).__getValue()}%`
              }
            ]}
          />
        </View>

        <Text style={styles.prayerTime}>
          {nextPrayerData.nextPrayer.time}
        </Text>
      </View>
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
  countdownHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00897B',
    textAlign: 'center',
  },
  countdownBody: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00897B',
    borderRadius: 4,
  },
  prayerTime: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default VisualPrayerCountdown;
