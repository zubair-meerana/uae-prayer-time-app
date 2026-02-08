import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { getCurrentHijriDate, formatHijriDate, getNextHijriDate, getPreviousHijriDate } from '../utils/islamicCalendarUtils';

const IslamicCalendar = () => {
  const { t, language, isRTL } = useLanguage();
  const [currentHijriDate, setCurrentHijriDate] = useState(getCurrentHijriDate());
  const [displayDate, setDisplayDate] = useState(getCurrentHijriDate());

  useEffect(() => {
    // Update the current date every minute to ensure accuracy
    const interval = setInterval(() => {
      const now = getCurrentHijriDate();
      setCurrentHijriDate(now);
      // If we're showing today's date, update it
      if (displayDate.year === currentHijriDate.year &&
          displayDate.month === currentHijriDate.month &&
          displayDate.day === currentHijriDate.day) {
        setDisplayDate(now);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const goToToday = () => {
    setDisplayDate(currentHijriDate);
  };

  const goToNextDay = () => {
    setDisplayDate(getNextHijriDate(displayDate));
  };

  const goToPreviousDay = () => {
    setDisplayDate(getPreviousHijriDate(displayDate));
  };

  const isToday = (
    displayDate.year === currentHijriDate.year &&
    displayDate.month === currentHijriDate.month &&
    displayDate.day === currentHijriDate.day
  );

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <View style={styles.calendarHeader}>
        <Text style={styles.title}>{t('islamicDate')}</Text>
      </View>

      <View style={styles.dateDisplay}>
        <Text style={styles.hijriDate}>
          {formatHijriDate(displayDate, language)}
        </Text>

        {!isToday && (
          <Text style={styles.todayLabel} onPress={goToToday}>
            {t('today')} ({formatHijriDate(currentHijriDate, language)})
          </Text>
        )}
      </View>

      <View style={styles.navigationButtons}>
        <Text style={styles.navButton} onPress={goToPreviousDay}>
          {language === 'ar' ? '▶' : '◀'} {/* Arrow pointing left in LTR, right in RTL */}
        </Text>

        <Text style={styles.navButton} onPress={goToToday}>
          {t('today')}
        </Text>

        <Text style={styles.navButton} onPress={goToNextDay}>
          {language === 'ar' ? '◀' : '▶'} {/* Arrow pointing right in LTR, left in RTL */}
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
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00897B',
  },
  dateDisplay: {
    alignItems: 'center',
    marginBottom: 15,
  },
  hijriDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  todayLabel: {
    fontSize: 14,
    color: '#00897B',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00897B',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: 50,
    textAlign: 'center',
  },
});

export default IslamicCalendar;
