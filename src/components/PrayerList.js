import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PrayerItem from './PrayerItem';

const PrayerList = ({ prayers, nextPrayerData }) => {
    if (!prayers || prayers.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No prayer times available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.listContainer}>
            {prayers.map((prayer) => {
                // Check if this is the next prayer
                const isNext = nextPrayerData &&
                    nextPrayerData.nextPrayer &&
                    nextPrayerData.nextPrayer.name === prayer.name &&
                    !nextPrayerData.isTomorrow;

                return (
                    <PrayerItem
                        key={prayer.name}
                        name={prayer.name}
                        time={prayer.time}
                        isNext={isNext}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
});

export default PrayerList;
