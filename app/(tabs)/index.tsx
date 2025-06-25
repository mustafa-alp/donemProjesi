import {
  StyleSheet,
  View,
  Animated,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useState, useRef, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firebaseDatabase } from "@/firebaseConfig";
import { MapStyle } from "./MapStyle";
import {
  Button,
  Portal,
  Provider,
  Text,
  Surface,
  useTheme,
  Dialog,
  TextInput,
} from "react-native-paper";
import TripModal from "./components/Modal";
import {
  calculateShortestRoute,
  fetchNearbyPlaces,
  handleSubmit,
  startSelectingLocations,
  confirmPlaceSelection,
  getMarkerColor,
  getMarkerIcon,
  addItemsToFirebase,
  showSelectedLocation,
  deleteLocation,
  fetchData,
} from "@/helpers";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface HomeScreenProps {
  selectedPlaces: string[];
}

export default function HomeScreen({
  selectedPlaces,
  setSelectedPlaces,
  listModalVisible,
  setListModalVisible,
}: HomeScreenProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startLocation, setStartLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [endLocation, setEndLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [placeLocations, setPlaceLocations] = useState<
    Array<{
      latitude: number;
      longitude: number;
      name: string;
      type: string;
    }>
  >([]);
  const [selectingLocation, setSelectingLocation] = useState(false);
  const [selectingStart, setSelectingStart] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [modelTxt, setModelTxt] = useState(false);
  // KONTROL ET: loadingPlaces hiçbir yerde kullanilmamis.
  const mapRef = useRef<MapView>(null);
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const [selectedPlaceLocations, setSelectedPlaceLocations] = useState<
    Array<{
      latitude: number;
      longitude: number;
      name: string;
      type: string;
    }>
  >([]);
  const [showPlaceDialog, setShowPlaceDialog] = useState(false);
  const [currentPlace, setCurrentPlace] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    type: string;
  } | null>(null);
  const [hasToggleApplyButton, setHasToggleApplyButton] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(firebaseDatabase, "locations")
        );
        const allLocationData = [];

        querySnapshot.forEach((doc) => {
          allLocationData.push({ id: doc.id, ...doc.data() });
        });
        setData(allLocationData);
      } catch (error) {
        console.log(error);
        Alert.alert("Bir hata meydana geldi.");
      }
    };

    fetchData();
  }, [listModalVisible]);

  useEffect(() => {
    if (selectedPlaces.length > 0) {
      fetchNearbyPlaces(
        selectedPlaces,
        (newPlaces) => {
          // Sadece henüz seçilmemiş yerleri ekle
          const filteredNewPlaces = newPlaces.filter(
            (newPlace) =>
              !selectedPlaceLocations.some(
                (selectedPlace) =>
                  selectedPlace.name.toLowerCase().trim() === newPlace.name.toLowerCase().trim()
              )
          );
          setPlaceLocations(filteredNewPlaces);
        },
        setLoadingPlaces,
        GOOGLE_PLACES_API_KEY
      );
    } else {
      setPlaceLocations([]);
    }
  }, [selectedPlaces]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.forceUpdate();
    }
  }, [selectedPlaceLocations]);

  const handleMapPress = (e: any) => {
    if (!selectingLocation) return;

    const { latitude, longitude } = e.nativeEvent.coordinate;

    if (selectingStart) {
      setStartLocation({ latitude, longitude });
      setSelectingStart(false);
    } else if (selectingEnd) {
      setEndLocation({ latitude, longitude });
      setSelectingEnd(false);
    }

    setSelectingLocation(false);
    setModelTxt(true);
  };

  const openModel = () => {
    setModelTxt(true);
  };

  useEffect(() => {
    if (modelTxt) {
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(modalAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [modelTxt]);

  const handleMarkerPress = (place: {
    latitude: number;
    longitude: number;
    name: string;
    type: string;
  }) => {
    setCurrentPlace(place);
    setShowPlaceDialog(true);
  };

  const removePlaceFromList = (
    place: { latitude: number; longitude: number; name: string; type: string } | null,
    selectedPlaceLocations: Array<{ latitude: number; longitude: number; name: string; type: string }>,
    setSelectedPlaceLocations: (places: Array<{ latitude: number; longitude: number; name: string; type: string }>) => void,
    setShowPlaceDialog: (show: boolean) => void,
    setCurrentPlace: (place: { latitude: number; longitude: number; name: string; type: string } | null) => void
  ) => {
    if (place) {
      if (selectedPlaceLocations.length <= 2) {
        Alert.alert(
          "Uyarı",
          "Listede en az 2 yer olmalıdır. Yer çıkarılamaz.",
          [{ text: "Tamam", onPress: () => setShowPlaceDialog(false) }]
        );
        return;
      }

      const updatedPlaces = selectedPlaceLocations.filter(
        (p) => p.name.toLowerCase().trim() !== place.name.toLowerCase().trim()
      );
      setSelectedPlaceLocations(updatedPlaces);
      
      // Rota güncelleme
      if (startLocation && endLocation) {
        calculateShortestRoute(
          updatedPlaces,
          startLocation,
          endLocation,
          setRouteCoords,
          setHasToggleApplyButton
        );
      }
    }
    setShowPlaceDialog(false);
    setCurrentPlace(null);
  };

  const isPlaceInList = (
    place: { latitude: number; longitude: number; name: string; type: string } | null,
    selectedPlaceLocations: Array<{ latitude: number; longitude: number; name: string; type: string }>
  ) => {
    if (!place) return false;
    return selectedPlaceLocations.some(
      (p) => p.name.toLowerCase().trim() === place.name.toLowerCase().trim()
    );
  };

  const handleClear = () => {
    setStartLocation(null);
    setEndLocation(null);
    setRouteCoords([]);
    setSelectedPlaceLocations([]);
    setPlaceLocations([]);
    setSelectedPlaces([]);
    setHasToggleApplyButton(false);
    setModelTxt(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    plusButton: {
      position: "absolute",
      bottom: 120,
      right: 20,
      borderRadius: 25,
      elevation: 4,
    },
    modalContent: {
      backgroundColor: "white",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "80%",
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
    },
    input: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 10,
    },
    chipsContainer: {
      marginBottom: 15,
      maxHeight: 50,
    },
    chipsContent: {
      paddingHorizontal: 5,
      paddingVertical: 5,
    },
    chip: {
      marginHorizontal: 4,
      backgroundColor: "#F5F5F5",
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    selectedChip: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      color: "#333",
    },
    selectedChipText: {
      color: "#FFF",
    },
    locationButton: {
      marginBottom: 15,
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
      borderColor: "#d32f2f",
    },
    submitButton: {
      backgroundColor: "#2196f3",
    },
    locationSelectionOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      padding: 20,
      alignItems: "center",
      elevation: 4,
    },
    locationSelectionText: {
      fontSize: 16,
      marginBottom: 10,
      textAlign: "center",
    },
    cancelSelectionButton: {
      marginTop: 10,
    },
    selectionOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      padding: 20,
      alignItems: "center",
      elevation: 4,
    },
    selectionText: {
      fontSize: 16,
      marginBottom: 10,
      textAlign: "center",
    },
    applyButton: {
      borderRadius: 25,
    },
    listModalContainer: {
      backgroundColor: "white",
      padding: 32,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "flex-start",
      elevation: 8,
      minHeight: 320,
    },
    listModalContent: {
      alignItems: "center",
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#f5f5f5",
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 2,
      width: "100%",
    },
    routeText: {
      fontSize: 16,
      flex: 1,
      color: "#333",
    },
    useButton: {
      marginLeft: 12,
      borderRadius: 8,
    },
  });

  return (
    <Provider>
      <View style={styles.container}>
        <MapView
          customMapStyle={MapStyle}
          ref={mapRef}
          style={styles.map}
          region={{
            latitude: 37.874641,
            longitude: 32.493156,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={handleMapPress}
        >
          {startLocation && (
            <Marker
              coordinate={startLocation}
              title="Başlangıç Konumu"
              pinColor="orange"
            />
          )}
          {endLocation && (
            <Marker
              coordinate={endLocation}
              title="Bitiş Konumu"
              pinColor="blue"
            />
          )}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#388e3c"
              strokeWidth={5}
            />
          )}
          {(hasToggleApplyButton ? selectedPlaceLocations : [...selectedPlaceLocations, ...placeLocations]).map(
            (place, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={place.type}
                pinColor={getMarkerColor(place, selectedPlaceLocations)}
                onPress={() => handleMarkerPress(place)}
              >
                <MaterialCommunityIcons
                  name={getMarkerIcon(place.type)}
                  size={24}
                  color="#fff"
                  style={{
                    backgroundColor: getMarkerColor(
                      place,
                      selectedPlaceLocations
                    ),
                    borderRadius: 12,
                    padding: 2,
                  }}
                />
              </Marker>
            )
          )}
        </MapView>

        <View
          style={{
            flexDirection: "row",
            position: "absolute",
            bottom: 120,
            left: 0,
            width: "100%",
            paddingHorizontal: 10,
            justifyContent: "space-between",
          }}
        >
          <Button
            mode="contained"
            style={[
              styles.applyButton,
              {
                flex: 1,
                marginHorizontal: 5,
                position: "relative",
                left: 0,
                width: undefined,
                minWidth: 0,
              },
            ]}
            onPress={() => {
              calculateShortestRoute(
                selectedPlaceLocations,
                startLocation,
                endLocation,
                setRouteCoords,
                setHasToggleApplyButton
              );
            }}
          >
            {hasToggleApplyButton ? "Göster" : "Uygula"}
          </Button>
          <Button
            mode="contained"
            style={{
              flex: 1,
              borderRadius: 25,
              marginHorizontal: 5,
              minWidth: 0,
            }}
            icon="content-save"
            onPress={() => setSaveModalVisible(true)}
          >
            Kaydet
          </Button>
          <Button
            mode="contained"
            style={{
              flex: 1,
              borderRadius: 25,
              marginHorizontal: 5,
              minWidth: 0,
            }}
            icon="plus"
            onPress={openModel}
          >
            Yeni Gezi
          </Button>
        </View>

        {selectingLocation && (
          <Surface style={styles.locationSelectionOverlay}>
            <Text style={styles.locationSelectionText}>
              {selectingStart ? "Başlangıç" : "Bitiş"} konumunu seçmek için
              haritaya dokunun
            </Text>
            <Button
              mode="contained"
              onPress={() => setSelectingLocation(false)}
              style={styles.cancelSelectionButton}
            >
              İptal
            </Button>
          </Surface>
        )}

        <Portal>
          <TripModal
            visible={modelTxt}
            onClose={() => setModelTxt(false)}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            startSelectingStartLocation={() =>
              startSelectingLocations(
                setSelectingLocation,
                true,
                setSelectingStart,
                true,
                setSelectingEnd,
                false,
                setModelTxt,
                false
              )
            }
            startSelectingEndLocation={() =>
              startSelectingLocations(
                setSelectingLocation,
                true,
                setSelectingStart,
                false,
                setSelectingEnd,
                true,
                setModelTxt,
                false
              )
            }
            startLocation={startLocation}
            endLocation={endLocation}
            handleSubmit={() =>
              handleSubmit(
                startLocation,
                endLocation,
                GOOGLE_PLACES_API_KEY,
                setRouteCoords,
                selectedPlaces,
                setPlaceLocations,
                setModelTxt
              )
            }
            modalAnimation={modalAnimation}
            setStartLocation={setStartLocation}
            setEndLocation={setEndLocation}
            setRouteCoords={setRouteCoords}
            setPlaceLocations={setPlaceLocations}
            handleClear={handleClear}
          />
        </Portal>

        <Portal>
          <Dialog
            visible={showPlaceDialog}
            onDismiss={() => setShowPlaceDialog(false)}
          >
            <Dialog.Title>
              {isPlaceInList(currentPlace, selectedPlaceLocations) ? "Yer Çıkar" : "Yer Ekle"}
            </Dialog.Title>
            <Dialog.Content>
              <Text>
                {currentPlace?.name} yerini {isPlaceInList(currentPlace, selectedPlaceLocations) ? "gezi listesinden çıkarmak" : "gezi listesine eklemek"} istiyor musunuz?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowPlaceDialog(false)}>İptal</Button>
              {isPlaceInList(currentPlace, selectedPlaceLocations) ? (
                <Button
                  onPress={() =>
                    removePlaceFromList(
                      currentPlace,
                      selectedPlaceLocations,
                      setSelectedPlaceLocations,
                      setShowPlaceDialog,
                      setCurrentPlace
                    )
                  }
                  textColor={theme.colors.error}
                >
                  Çıkar
                </Button>
              ) : (
                <Button
                  onPress={() =>
                    confirmPlaceSelection(
                      currentPlace,
                      selectedPlaceLocations,
                      setSelectedPlaceLocations,
                      setShowPlaceDialog,
                      setCurrentPlace
                    )
                  }
                >
                  Ekle
                </Button>
              )}
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Modal
          visible={listModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setListModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <View
              style={[
                styles.listModalContainer,
                { width: "90%", maxWidth: 420, minHeight: 320 },
              ]}
            >
              <Text style={styles.modalTitle}>Kayıtlı Rotalar</Text>
              <ScrollView
                style={{
                  flex: 1,
                  width: "100%",
                }}
              >
                {data.map((item) => (
                  <View style={styles.routeRow} key={item.id}>
                    <Text style={styles.routeText}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button
                        mode="contained"
                        style={[styles.useButton, { minWidth: 30, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }]}
                        onPress={() =>
                          showSelectedLocation(
                            item.startLocation,
                            setStartLocation,
                            item.endLocation,
                            setEndLocation,
                            GOOGLE_PLACES_API_KEY,
                            setRouteCoords,
                            setModelTxt,
                            item.selectedPlaceLocations,
                            setSelectedPlaceLocations,
                            setHasToggleApplyButton,
                            setListModalVisible
                          )
                        }
                        icon={({ size, color }) => (
                          <MaterialCommunityIcons
                            name="check"
                            size={size}
                            color={color}
                            style={{ marginRight: -15 }}
                          />
                        )}
                        buttonColor="green"
                      >
                      </Button>
                      <Button
                        mode="contained"
                        style={[styles.useButton, { minWidth: 30, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }]}
                        onPress={() => {
                          Alert.alert(
                            "Rota Sil",
                            "Bu rotayı silmek istediğinizden emin misiniz?",
                            [
                              {
                                text: "İptal",
                                style: "cancel"
                              },
                              {
                                text: "Sil",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await deleteLocation(item.id);
                                    await fetchData(setData);
                                  } catch (error) {
                                    console.log(error);
                                    Alert.alert("Hata", "Rota silinirken bir hata oluştu.");
                                  }
                                }
                              }
                            ]
                          );
                        }}
                        icon={({ size, color }) => (
                          <MaterialCommunityIcons
                            name="delete"
                            size={size}
                            color={color}
                            style={{ marginRight: -15 }}
                          />
                        )}
                        buttonColor="red"
                      >
                      </Button>
                    </View>
                  </View>
                ))}

                <View style={{ marginBottom: 12 }} />
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  alignSelf: "center",
                  marginTop: 10,
                }}
              >
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
                  icon="check"
                  style={{ flex: 1, marginHorizontal: 5 }}
                  onPress={() => setListModalVisible(false)}
                  contentStyle={{ paddingVertical: 2 }}
                  textColor="white"
                  labelStyle={{ fontSize: 13 }}
                >
                  Tamam
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Kaydet Modalı */}
        <Portal>
          <Dialog
            visible={saveModalVisible}
            onDismiss={() => setSaveModalVisible(false)}
          >
            <Dialog.Title>Rota Kaydet</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Rota İsmi"
                value={routeName}
                onChangeText={setRouteName}
                mode="outlined"
                style={{ marginBottom: 16 }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setSaveModalVisible(false)}
                textColor={theme.colors.error}
              >
                İptal
              </Button>

              <Button
                mode="contained"
                onPress={() =>
                  addItemsToFirebase(
                    routeName,
                    endLocation,
                    startLocation,
                    selectedPlaceLocations,
                    setSaveModalVisible,
                    setRouteName
                  )
                }
                disabled={!routeName.trim()}
              >
                Kaydet
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </Provider>
  );
}
