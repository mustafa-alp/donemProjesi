import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip, Button, Portal, Modal, Surface } from 'react-native-paper';

const placeTypes = [
  { id: 'restaurant', name: 'Restoran' },
  { id: 'cafe', name: 'Kafe' },
  { id: 'museum', name: 'Müze' },
  { id: 'park', name: 'Park' },
  { id: 'shopping_mall', name: 'AVM' },
  { id: 'tourist_attraction', name: 'Turistik Yer' },
];

export default function GeziModal({ visible, onClose, selectedPlaces, setSelectedPlaces }) {
  const handleClear = () => {
    setSelectedPlaces([]);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContent}
      >
        <Surface style={styles.container}>
          <Text style={styles.title}>Gezilecek Yerler</Text>
          <Text style={styles.subtitle}>Gezmek istediğiniz yerleri seçin</Text>
          
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
                    setSelectedPlaces(selectedPlaces.filter(id => id !== type.id));
                  } else {
                    setSelectedPlaces([...selectedPlaces, type.id]);
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

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleClear}
              style={[styles.button, styles.clearButton]}
              textColor="#d32f2f"
              icon="delete"
            >
              Temizle
            </Button>
            <Button
              mode="contained"
              onPress={onClose}
              style={[styles.button, styles.closeButton]}
              icon="check"
            >
              Tamam
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  chipsContainer: {
    maxHeight: 60,
    marginBottom: 20,
  },
  chipsContent: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  chip: {
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedChip: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  chipText: {
    color: '#333',
  },
  selectedChipText: {
    color: '#FFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  clearButton: {
    borderColor: '#d32f2f',
  },
  closeButton: {
    backgroundColor: '#6200ee',
  },
});
