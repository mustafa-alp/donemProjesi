import { StyleSheet, View, Alert, Animated } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useState, useRef, useEffect } from 'react';
import { MapStyle } from "./MapStyle";
import { Button, Portal, Provider, Text, Surface, useTheme, Dialog } from 'react-native-paper';
import TripModal from './components/Modal';

const GOOGLE_PLACES_API_KEY = mapkey;

interface HomeScreenProps {
  selectedPlaces: string[];
}

export default function HomeScreen({ selectedPlaces }: HomeScreenProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startLocation, setStartLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [endLocation, setEndLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [placeLocations, setPlaceLocations] = useState<Array<{
    latitude: number;
    longitude: number;
    name: string;
    type: string;
  }>>([]);
  const [selectingLocation, setSelectingLocation] = useState(false);
  const [selectingStart, setSelectingStart] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [modelTxt, setModelTxt] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const mapRef = useRef<MapView>(null);
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const [selectedPlaceLocations, setSelectedPlaceLocations] = useState<Array<{
    latitude: number;
    longitude: number;
    name: string;
    type: string;
  }>>([]);
  const [showPlaceDialog, setShowPlaceDialog] = useState(false);
  const [currentPlace, setCurrentPlace] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    type: string;
  } | null>(null);

  const placeTypes = [
    { id: 'restaurant', name: 'Restoran' },
    { id: 'cafe', name: 'Kafe' },
    { id: 'museum', name: 'Müze' },
    { id: 'park', name: 'Park' },
    { id: 'shopping_mall', name: 'AVM' },
    { id: 'tourist_attraction', name: 'Turistik Yer' },
  ];

  const fetchNearbyPlaces = async () => {
    if (selectedPlaces.length === 0) {
      setPlaceLocations([]);
      return;
    }

    setLoadingPlaces(true);
    try {
      const allPlaces = [];
      
      for (const type of selectedPlaces) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.874641,32.493156&radius=5000&type=${type}&key=${GOOGLE_PLACES_API_KEY}&language=tr`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results) {
          const places = data.results.map((place: any) => ({
            name: place.name,
            type: place.types[0],
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          }));
          allPlaces.push(...places);
        }
      }
      
      setPlaceLocations(allPlaces);
    } catch (error) {
      Alert.alert(
        "Hata",
        "Yerler yüklenirken bir hata oluştu. Lütfen internet bağlantınızı ve API anahtarınızı kontrol edin."
      );
    } finally {
      setLoadingPlaces(false);
    }
  };

  useEffect(() => {
    if (selectedPlaces.length > 0) {
      fetchNearbyPlaces();
    } else {
      setPlaceLocations([]);
    }
  }, [selectedPlaces]);

  const fetchRoute = async (start: { latitude: number, longitude: number }, end: { latitude: number, longitude: number }) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=${GOOGLE_PLACES_API_KEY}&mode=walking&language=tr`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
      } else {
        setRouteCoords([]);
      }
    } catch (error) {
      setRouteCoords([]);
    }
  };

  function decodePolyline(encoded: string) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }
    return points;
  }

  useEffect(() => {
    if (startLocation && endLocation) {
      fetchRoute(startLocation, endLocation);
    } else {
      setRouteCoords([]);
    }
  }, [startLocation, endLocation]);

  // Seçili yerler değiştiğinde marker'ları güncelle
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

  const startSelectingStartLocation = () => {
    setSelectingLocation(true);
    setSelectingStart(true);
    setSelectingEnd(false);
    setModelTxt(false);
  };

  const startSelectingEndLocation = () => {
    setSelectingLocation(true);
    setSelectingEnd(true);
    setSelectingStart(false);
    setModelTxt(false);
  };

  const openModel = () => {
    setModelTxt(true);
  };

  const handleSubmit = async () => {
    if (!startLocation || !endLocation) {
      Alert.alert('Hata', 'Başlangıç veya bitiş konumu seçilmemiş.');
      return;
    }

    try {
      // Rota oluştur
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLocation.latitude},${startLocation.longitude}&destination=${endLocation.latitude},${endLocation.longitude}&key=${GOOGLE_PLACES_API_KEY}&mode=walking&language=tr`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const points = data.routes[0].overview_polyline.points;
        const coords = decodePolyline(points);
        setRouteCoords(coords);
      }

      // Seçili yerleri getir
      if (selectedPlaces.length > 0) {
        const allPlaces = [];
        for (const type of selectedPlaces) {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${startLocation.latitude},${startLocation.longitude}&radius=5000&type=${type}&key=${GOOGLE_PLACES_API_KEY}&language=tr`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.status === 'OK' && data.results) {
            const places = data.results.map((place: any) => ({
              name: place.name,
              type: place.types[0],
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            }));
            allPlaces.push(...places);
          }
        }
        setPlaceLocations(allPlaces);
      }

      setModelTxt(false);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
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

  const getMarkerColor = (place: {
    latitude: number;
    longitude: number;
    name: string;
    type: string;
  }) => {
    // Eğer yer seçili yerler listesinde varsa siyah renk döndür
    const isSelected = selectedPlaceLocations.some(
      selectedPlace => 
        selectedPlace.latitude === place.latitude && 
        selectedPlace.longitude === place.longitude
    );
    
    if (isSelected) {
      return '#000000'; // Siyah renk
    }

    // Seçili değilse normal renk döndür
    switch (place.type) {
      case 'restaurant':
        return '#FF5252'; // Kırmızı
      case 'cafe':
        return '#FF9800'; // Turuncu
      case 'museum':
        return '#2196F3'; // Mavi
      case 'park':
        return '#4CAF50'; // Yeşil
      case 'shopping_mall':
        return '#FFC107'; // Sarı
      case 'tourist_attraction':
        return '#00BCD4'; // Turkuaz
      default:
        return '#9E9E9E'; // Gri
    }
  };

  const handleMarkerPress = (place: {
    latitude: number;
    longitude: number;
    name: string;
    type: string;
  }) => {
    setCurrentPlace(place);
    setShowPlaceDialog(true);
  };

  const confirmPlaceSelection = () => {
    if (currentPlace) {
      const updatedPlaces = [...selectedPlaceLocations, currentPlace];
      setSelectedPlaceLocations(updatedPlaces);
      console.log('Seçilen yerler:', updatedPlaces);
    }
    setShowPlaceDialog(false);
    setCurrentPlace(null);
  };

  const calculateShortestRoute = () => {
    if (selectedPlaceLocations.length < 2) {
      Alert.alert('Hata', 'En az iki yer seçmelisiniz.');
      return;
    }

    const start = startLocation;
    const end = endLocation;
    const places = selectedPlaceLocations;

    // En kısa mesafeyi bulmak için bir algoritma uygulayın
    let shortestDistance = Infinity;
    let bestRoute: Array<{ latitude: number; longitude: number; name: string; type: string; }> = [];

    const permute = (arr, l, r) => {
      if (l === r) {
        // Rota hesapla
        let totalDistance = euclideanDistance(start, arr[0]) + euclideanDistance(arr[arr.length - 1], end);
        for (let i = 0; i < arr.length - 1; i++) {
          totalDistance += euclideanDistance(arr[i], arr[i + 1]);
        }

        if (totalDistance < shortestDistance) {
          shortestDistance = totalDistance;
          bestRoute = arr;
        }
      } else {
        for (let i = l; i <= r; i++) {
          [arr[l], arr[i]] = [arr[i], arr[l]]; // Swap
          permute(arr, l + 1, r);
          [arr[l], arr[i]] = [arr[i], arr[l]]; // Backtrack
        }
      }
    };

    permute(places, 0, places.length - 1);

    // En kısa rotayı çizin
    if (start && end) {
      const routeCoords = [start, ...bestRoute, end];
      setRouteCoords(routeCoords);
    } else {
      Alert.alert('Hata', 'Başlangıç veya bitiş konumu seçilmemiş.');
    }

    console.log('Başlangıç konumu:', startLocation);
    console.log('Bitiş konumu:', endLocation);
    console.log('En kısa rota:', bestRoute);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    plusButton: {
      position: 'absolute',
      bottom: 120,
      right: 20,
      borderRadius: 25,
      elevation: 4,
    },
    modalContent: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
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
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    selectedChip: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      color: '#333',
    },
    selectedChipText: {
      color: '#FFF',
    },
    locationButton: {
      marginBottom: 15,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      flex: 1,
      marginHorizontal: 5,
    },
    clearButton: {
      borderColor: '#d32f2f',
    },
    submitButton: {
      backgroundColor: '#2196f3',
    },
    locationSelectionOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: 20,
      alignItems: 'center',
      elevation: 4,
    },
    locationSelectionText: {
      fontSize: 16,
      marginBottom: 10,
      textAlign: 'center',
    },
    cancelSelectionButton: {
      marginTop: 10,
    },
    selectionOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: 20,
      alignItems: 'center',
      elevation: 4,
    },
    selectionText: {
      fontSize: 16,
      marginBottom: 10,
      textAlign: 'center',
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
              pinColor="green"
            />
          )}
          {endLocation && (
            <Marker
              coordinate={endLocation}
              title="Bitiş Konumu"
              pinColor="red"
            />
          )}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#388e3c"
              strokeWidth={5}
            />
          )}
          {placeLocations.map((place, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude
              }}
              title={place.name}
              description={place.type}
              pinColor={getMarkerColor(place)}
              onPress={() => handleMarkerPress(place)}
            />
          ))}
        </MapView>

        <Button
          mode="contained"
          style={styles.plusButton}
          onPress={openModel}
          icon="plus"
        >
          Yeni Gezi
        </Button>

        {selectingLocation && (
          <Surface style={styles.locationSelectionOverlay}>
            <Text style={styles.locationSelectionText}>
              {selectingStart ? 'Başlangıç' : 'Bitiş'} konumunu seçmek için haritaya dokunun
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
            startSelectingStartLocation={startSelectingStartLocation}
            startSelectingEndLocation={startSelectingEndLocation}
            startLocation={startLocation}
            endLocation={endLocation}
            handleSubmit={handleSubmit}
            modalAnimation={modalAnimation}
            setStartLocation={setStartLocation}
            setEndLocation={setEndLocation}
            setRouteCoords={setRouteCoords}
            setPlaceLocations={setPlaceLocations}
          />
        </Portal>

        <Portal>
          <Dialog visible={showPlaceDialog} onDismiss={() => setShowPlaceDialog(false)}>
            <Dialog.Title>Yer Ekle</Dialog.Title>
            <Dialog.Content>
              <Text>{currentPlace?.name} yerini gezi listesine eklemek istiyor musunuz?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowPlaceDialog(false)}>İptal</Button>
              <Button onPress={confirmPlaceSelection}>Ekle</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </Provider>
  );
}

function euclideanDistance(start: { latitude: number; longitude: number; } | null, end: { latitude: number; longitude: number; } | null): number {
  if (!start || !end) {
    return Infinity; // Return a large number if either point is null
  }
  const dx = start.latitude - end.latitude;
  const dy = start.longitude - end.longitude;
  return Math.sqrt(dx * dx + dy * dy);
}
