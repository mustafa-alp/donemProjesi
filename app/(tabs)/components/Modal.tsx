import React, { useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import {
  Text,
  Button,
  Portal,
  Modal,
  useTheme,
  Dialog,
} from "react-native-paper";

interface TripModalProps {
  visible: boolean;
  onClose: () => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  startSelectingStartLocation: () => void;
  startSelectingEndLocation: () => void;
  startLocation: { latitude: number; longitude: number } | null;
  endLocation: { latitude: number; longitude: number } | null;
  handleSubmit: () => void;
  modalAnimation: Animated.Value;
  setStartLocation: (
    location: { latitude: number; longitude: number } | null
  ) => void;
  setEndLocation: (
    location: { latitude: number; longitude: number } | null
  ) => void;
  setRouteCoords: (coords: { latitude: number; longitude: number }[]) => void;
  setPlaceLocations: (locations: any[]) => void;
  handleClear: () => void;
}

export default function TripModal({
  visible,
  onClose,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  startSelectingStartLocation,
  startSelectingEndLocation,
  startLocation,
  endLocation,
  handleSubmit,
  modalAnimation,
  setStartLocation,
  setEndLocation,
  setRouteCoords,
  setPlaceLocations,
  handleClear,
}: TripModalProps) {
  const theme = useTheme();
  const [selectedPlaces, setSelectedPlaces] = useState<any[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentPlace, setCurrentPlace] = useState<any>(null);

  const handleSubmitAndClose = () => {
    handleSubmit();
    onClose();
  };

  const handlePlaceSelect = (place: any) => {
    setCurrentPlace(place);
    setShowConfirmDialog(true);
  };

  // KONTROL ET: Bu fonksiyon farkli yerde de tanimli.
  // bunun yerine helper fonksiyonlar olusturup tek bir fonksiyonu
  // farkli yerlerde kullanabilirsin.
  const confirmPlaceSelection = () => {
    if (currentPlace) {
      setSelectedPlaces([...selectedPlaces, currentPlace]);
      setPlaceLocations([...selectedPlaces, currentPlace]);
    }
    setShowConfirmDialog(false);
    setCurrentPlace(null);
  };

  const styles = StyleSheet.create({
    modalContent: {
      margin: 20,
      borderRadius: theme.roundness * 2,
      overflow: "hidden",
    },
    modalInnerContainer: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: theme.roundness * 2,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      color: theme.colors.onSurface,
    },
    locationButton: {
      marginBottom: 15,
      borderColor: theme.colors.outline,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    button: {
      flex: 1,
      marginHorizontal: 5,
    },
    clearButton: {
      borderColor: theme.colors.error,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
    },
    selectedPlacesContainer: {
      marginTop: 10,
      marginBottom: 10,
    },
    selectedPlaceText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      marginBottom: 5,
    },
  });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContent}
      >
        <Animated.View
          style={[
            styles.modalInnerContainer,
            {
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.modalTitle}>Yeni Gezi</Text>

          <Button
            mode="outlined"
            onPress={startSelectingStartLocation}
            style={styles.locationButton}
            icon={startLocation ? "check-circle" : "map-marker"}
            textColor={theme.colors.primary}
          >
            {startLocation
              ? "Başlangıç Konumu Seçildi"
              : "Başlangıç Konumu Seç"}
          </Button>

          <Button
            mode="outlined"
            onPress={startSelectingEndLocation}
            style={styles.locationButton}
            icon={endLocation ? "check-circle" : "map-marker"}
            textColor={theme.colors.primary}
          >
            {endLocation ? "Bitiş Konumu Seçildi" : "Bitiş Konumu Seç"}
          </Button>

          {selectedPlaces.length > 0 && (
            <View style={styles.selectedPlacesContainer}>
              <Text style={styles.selectedPlaceText}>Seçilen Yerler:</Text>
              {selectedPlaces.map((place, index) => (
                <Text key={index} style={styles.selectedPlaceText}>
                  • {place.name || `Yer ${index + 1}`}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleClear}
              style={[styles.button, styles.clearButton]}
              textColor={theme.colors.error}
              icon="delete"
            >
              Temizle
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmitAndClose}
              style={[styles.button, styles.submitButton]}
              icon="check"
              textColor="white"
              disabled={!startLocation || !endLocation}
            >
              Oluştur
            </Button>
          </View>
        </Animated.View>
      </Modal>

      <Dialog
        visible={showConfirmDialog}
        onDismiss={() => setShowConfirmDialog(false)}
      >
        <Dialog.Title>Yer Ekle</Dialog.Title>
        <Dialog.Content>
          <Text>Bu yeri gezi listesine eklemek istiyor musunuz?</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowConfirmDialog(false)}>İptal</Button>
          <Button onPress={confirmPlaceSelection}>Ekle</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
