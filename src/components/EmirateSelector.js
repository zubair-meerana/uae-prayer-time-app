import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const EmirateSelector = ({ selectedEmirate, onSelect, availableEmirates }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { t, isRTL } = useLanguage();

    // Find the label for the currently selected value using translation
    const selectedLabel = t(`emirates.${selectedEmirate}`);

    const handleSelect = (value) => {
        onSelect(value);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('location')}</Text>
            <TouchableOpacity
                style={[styles.selectorButton, isRTL && styles.rtlDirection]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.selectorText}>{selectedLabel}</Text>
                <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('selectEmirate')}</Text>
                        <FlatList
                            data={availableEmirates}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        item.value === selectedEmirate && styles.selectedOption,
                                        isRTL && styles.rtlDirection
                                    ]}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        item.value === selectedEmirate && styles.selectedOptionText
                                    ]}>{t(`emirates.${item.value}`)}</Text>
                                    {item.value === selectedEmirate && <Text style={styles.checkmark}>✓</Text>}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        alignItems: 'center',
        zIndex: 10,
    },
    label: {
        fontSize: 12,
        textTransform: 'uppercase',
        color: '#888',
        letterSpacing: 1,
        marginBottom: 4,
    },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    rtlDirection: {
        flexDirection: 'row-reverse',
    },
    selectorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 8,
    },
    chevron: {
        fontSize: 12,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#333',
    },
    optionItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: '#F0F9F8',
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 16,
        color: '#444',
    },
    selectedOptionText: {
        color: '#00897B',
        fontWeight: 'bold',
    },
    checkmark: {
        color: '#00897B',
        fontSize: 18,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#eee',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});

export default EmirateSelector;
