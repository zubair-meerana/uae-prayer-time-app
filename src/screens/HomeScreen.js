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
        availableEmirates,
        displayDate,
        toggleDate,
        isDisplayingTomorrow
    } = usePrayerTimes();

    const { t, language, toggleLanguage, isRTL } = useLanguage();

    // Setup notifications on mount
    useEffect(() => {
        registerForPushNotificationsAsync();
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
                    <Text style={styles.date}>{formatDate(displayDate, language)}</Text>

                    {/* Date Segmented Control - Only show when next prayer is tomorrow */}
                    {nextPrayer && nextPrayer.isTomorrow && (
                        <View style={styles.segmentedControl}>
                            <TouchableOpacity
                                onPress={() => !isDisplayingTomorrow && toggleDate()}
                                style={[
                                    styles.segmentButton,
                                    styles.segmentLeft,
                                    !isDisplayingTomorrow && styles.segmentActive
                                ]}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    !isDisplayingTomorrow && styles.segmentTextActive
                                ]}>
                                    {t('today')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => isDisplayingTomorrow && toggleDate()}
                                style={[
                                    styles.segmentButton,
                                    styles.segmentRight,
                                    isDisplayingTomorrow && styles.segmentActive
                                ]}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    isDisplayingTomorrow && styles.segmentTextActive
                                ]}>
                                    {t('tomorrow')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Emirate Selector */}
                <EmirateSelector
                    selectedEmirate={selectedEmirate}
                    onSelect={setSelectedEmirate}
                    availableEmirates={availableEmirates}
                />

                {/* Next Prayer Highlight Banner (Optional, Extra Visual) */}
                {nextPrayer && (
                    <View style={[styles.banner, isRTL && styles.rtlBanner]}>
                        <Text style={styles.bannerText}>
                            {t('nextPrayer')}: {t(`prayers.${nextPrayer.nextPrayer.name}`)}
                        </Text>
                        <View style={[styles.bannerRow, isRTL && styles.rtlDirection]}>
                            <Text style={styles.bannerTime}>
                                {t('approx')} {(() => {
                                    const target = parseTime(nextPrayer.nextPrayer.time);
                                    if (nextPrayer.isTomorrow) {
                                        target.setDate(target.getDate() + 1);
                                    }
                                    return formatRemainingTime(
                                        target - new Date(),
                                        t
                                    );
                                })()}
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
    segmentedControl: {
        flexDirection: 'row',
        marginTop: 12,
        backgroundColor: '#E0F2F1',
        borderRadius: 25,
        padding: 3,
        alignSelf: 'center',
    },
    segmentButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentLeft: {
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 22,
    },
    segmentRight: {
        borderTopRightRadius: 22,
        borderBottomRightRadius: 22,
    },
    segmentActive: {
        backgroundColor: '#00897B',
        shadowColor: '#00897B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#00695C',
    },
    segmentTextActive: {
        color: '#FFFFFF',
    },
});
