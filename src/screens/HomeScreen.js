import React, { useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    StatusBar,
    RefreshControl,
    TouchableOpacity
} from 'react-native';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { formatDate, parseTime, formatRemainingTime } from '../utils/timeUtils';
import PrayerList from '../components/PrayerList';
import EmirateSelector from '../components/EmirateSelector';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { useLanguage } from '../context/LanguageContext';

export default function HomeScreen() {
    const {
        selectedEmirate,
        setSelectedEmirate,
        prayerTimes,
        nextPrayer,
        loading,
        error,
        refreshParams,
        availableEmirates
    } = usePrayerTimes();

    const { t, language, toggleLanguage, isRTL } = useLanguage();

    // Setup notifications on mount
    useEffect(() => {
        registerForPushNotificationsAsync();

        // Listener for when a notification is received while app is foreground
        const subscription = Notifications.addNotificationReceivedListener(notification => {
            // Handle foreground notification if needed
            console.log('Notification received:', notification);
        });

        return () => subscription.remove();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

            {/* Language Switcher - Top Right */}
            <View style={styles.langSwitchContainer}>
                <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
                    <Text style={styles.langText}>{language === 'en' ? 'Arabic (عربي)' : 'English'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refreshParams} />
                }
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.appTitle}>{t('appTitle')}</Text>
                    <Text style={styles.date}>{formatDate(new Date(), language)}</Text>
                </View>

                {/* Emirate Selector */}
                <EmirateSelector
                    selectedEmirate={selectedEmirate}
                    onSelect={setSelectedEmirate}
                    availableEmirates={availableEmirates}
                />

                {/* Next Prayer Highlight Banner (Optional, Extra Visual) */}
                {nextPrayer && !nextPrayer.isTomorrow && (
                    <View style={[styles.banner, isRTL && styles.rtlBanner]}>
                        <Text style={styles.bannerText}>
                            {t('nextPrayer')}: {t(`prayers.${nextPrayer.nextPrayer.name}`)}
                        </Text>
                        <View style={[styles.bannerRow, isRTL && styles.rtlDirection]}>
                            <Text style={styles.bannerTime}>
                                {t('approx')} {
                                    formatRemainingTime(
                                        parseTime(nextPrayer.nextPrayer.time) - new Date(),
                                        t
                                    )
                                }
                            </Text>
                        </View>
                    </View>
                )}

                {/* Error State */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{t('error')}: {error}</Text>
                        <Text style={styles.retryText} onPress={refreshParams}>{t('retry')}</Text>
                    </View>
                )}

                {/* Main List */}
                {loading && prayerTimes.length === 0 ? (
                    <ActivityIndicator size="large" color="#00897B" style={{ marginTop: 40 }} />
                ) : (
                    <PrayerList prayers={prayerTimes} nextPrayerData={nextPrayer} />
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('source')}</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    langSwitchContainer: {
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    langButton: {
        padding: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
    },
    langText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        marginTop: 0,
    },
    appTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#004D40', // Deep teal
        marginBottom: 4,
        textAlign: 'center',
    },
    date: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    banner: {
        backgroundColor: '#00897B',
        marginHorizontal: 20,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#00897B',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
    },
    rtlBanner: {
        // any rtl specific banner styles
    },
    bannerRow: {
        flexDirection: 'row',
    },
    rtlDirection: {
        flexDirection: 'row-reverse',
    },
    bannerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    bannerTime: {
        color: 'white',
        fontSize: 12,
        opacity: 0.9,
        marginTop: 2,
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    retryText: {
        color: 'blue',
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#AAA',
        fontSize: 12,
    },
});
