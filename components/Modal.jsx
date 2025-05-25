import React from 'react';
import { View, StyleSheet, Modal, Animated, ScrollView } from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';

export default function TripModal({
  visible,
  onClose,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  placeTypes,
  selectedPlaces,
  setSelectedPlaces,
  startSelectingStartLocation,
  startSelectingEndLocation,
  startLocation,
  endLocation,
  handleSubmit,
  styles,
  modalAnimation,
  setStartLocation,
  setEndLocation,
  setRouteCoords,
  setPlaceLocations
}) {
  const handleClear = () => {
    setStartLocation(null);
    setEndLocation(null);
    setRouteCoords([]);
    setPlaceLocations([]);
    setSelectedPlaces([]);
    setStartTime('');
    setEndTime('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0]
                  })
                }
              ]
            }
          ]}
        >
          <Text style={styles.modalTitle}>Gezi Detayları</Text>

          <TextInput
            label="Başlangıç Saati"
            value={startTime}
            onChangeText={setStartTime}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Bitiş Saati"
            value={endTime}
            onChangeText={setEndTime}
            style={styles.input}
            mode="outlined"
          />

          <Text style={styles.sectionTitle}>Gezilecek Yerler</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipsContainer}
            contentContainerStyle={styles.chipsContent}
          >
            {placeTypes.map((type) => (
              <Chip
                key={type.id}
                selected={selectedPlaces.includes(type.id)}
                onPress={() => {
                  if (selectedPlaces.includes(type.id)) {
                    setSelectedPlaces(prev => prev.filter(id => id !== type.id));
                  } else {
                    setSelectedPlaces(prev => [...prev, type.id]);
                  }
                }}
                style={[
                  styles.chip,
                  selectedPlaces.includes(type.id) && styles.selectedChip
                ]}
                textStyle={[
                  styles.chipText,
                  selectedPlaces.includes(type.id) && styles.selectedChipText
                ]}
              >
                {type.name}
              </Chip>
            ))}
          </ScrollView>

          <Button
            mode="outlined"
            onPress={startSelectingStartLocation}
            style={styles.locationButton}
            icon={startLocation ? "check-circle" : "map-marker"}
          >
            {startLocation ? 'Konum Seçildi' : 'Başlangıç Konumu Seç'}
          </Button>

          <Button
            mode="outlined"
            onPress={startSelectingEndLocation}
            style={styles.locationButton}
            icon={endLocation ? "check-circle" : "map-marker"}
          >
            {endLocation ? 'Konum Seçildi' : 'Bitiş Konumu Seç'}
          </Button>

          <Button
            mode="outlined"
            onPress={handleClear}
            style={styles.locationButton}
            icon="close-circle"
          >
            Temizle
          </Button>

          <Button
            mode="contained"
            onPress={() => {
              handleSubmit();
              onClose();
            }}
            style={styles.submitButton}
          >
            Oluştur
          </Button>
        </Animated.View>
      </View>
    </Modal>
  );
} 