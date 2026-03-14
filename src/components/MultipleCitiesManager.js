import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { getAvailableEmirates } from '../services/prayerApi';
import { addCityToMultipleCities, removeCityFromMultipleCities, getMultipleCities, isCityInMultipleCities } from '../services/multipleCitiesService';

const MultipleCitiesManager = ({ visible, onClose, onCityAdded }) => {
  const { t, isRTL } = useLanguage();
  const [allEmirates, setAllEmirates] = useState([]);
  const [multipleCities, setMultipleCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadCities();
    }
  }, [visible]);

  const loadCities = async () => {
    setLoading(true);
    try {
      const emirates = getAvailableEmirates();
      const savedCities = await getMultipleCities();

      // Add a flag to indicate if each emirate is already in the multiple cities list
      const emiratesWithFlags = emirates.map(emirate => ({
        ...emirate,
        isInMultipleCities: savedCities.some(city => city.locationCode === emirate.value)
      }));

      setAllEmirates(emiratesWithFlags);
      setMultipleCities(savedCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async (emirate) => {
    try {
      await addCityToMultipleCities(emirate.label, emirate.value);
      loadCities(); // Reload to update flags
      if (onCityAdded) {
        onCityAdded(emirate.value); // Notify parent component
      }
    } catch (error) {
      console.error('Error adding city:', error);
      Alert.alert(t('error'), t('failedToAddCity'));
    }
  };

  const handleRemoveCity = async (locationCode) => {
    try {
      await removeCityFromMultipleCities(locationCode);
      loadCities(); // Reload to update flags
    } catch (error) {
      console.error('Error removing city:', error);
      Alert.alert(t('error'), t('failedToRemoveCity'));
    }
  };

  const renderEmirateItem = ({ item }) => (
    <View style={styles.emirateItem}>
      <Text style={styles.emirateName}>{t(`emirates.${item.value}`)}</Text>
      {item.isInMultipleCities ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemoveCity(item.value)}
        >
          <Text style={styles.actionButtonText}>{t('remove')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => handleAddCity(item)}
        >
          <Text style={styles.actionButtonText}>{t('add')}</Text>
        </TouchableOpacity>
      )}
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
          <Text style={styles.modalTitle}>{t('manageMultipleCities')}</Text>

          {loading ? (
            <Text style={styles.loadingText}>{t('loading')}...</Text>
          ) : (
            <FlatList
              data={allEmirates}
              renderItem={renderEmirateItem}
              keyExtractor={(item) => item.value}
              style={styles.citiesList}
            />
          )}

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
  citiesList: {
    flex: 1,
    width: '100%',
  },
  emirateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emirateName: {
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  removeButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666',
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

export default MultipleCitiesManager;
