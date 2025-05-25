import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { BottomNavigation, Provider, Text, FAB, useTheme, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import HomeScreen from './index';
import GeziModal from './components/GeziModal';

interface Route {
  key: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

function SearchScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Search!</Text>
    </View>
  );
}

export default function TabLayout() {
  const [index, setIndex] = useState(0);
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [geziModalVisible, setGeziModalVisible] = useState(false);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [selectedPlaceLocations, setSelectedPlaceLocations] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);

  const routes: Route[] = [
    { key: 'home', title: 'Home', icon: 'home' },
    { key: 'trip', title: 'Gezi', icon: 'map-marker' },
    { key: 'search', title: 'Search', icon: 'magnify' },
  ];

  const renderScene = ({ route }: { route: Route }) => {
    switch (route.key) {
      case 'home':
        return <HomeScreen selectedPlaces={selectedPlaces} />;
      case 'search':
        return <SearchScreen />;
      default:
        return null;
    }
  };

  const handleTripPress = () => {
    setGeziModalVisible(true);
  };

  const handleModalClose = () => {
    setGeziModalVisible(false);
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
    let bestRoute = [];

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
    const routeCoords = [start, ...bestRoute, end];
    setRouteCoords(routeCoords);
  };

  return (
    <Provider>
      <View style={styles.container}>
        {renderScene({ route: routes[index] })}
        
        <BottomNavigation.Bar
          navigationState={{ index, routes }}
          onTabPress={({ route }) => {
            if (route.key === 'trip') {
              handleTripPress();
            } else {
              const newIndex = routes.findIndex((r) => r.key === route.key);
              if (newIndex !== -1) {
                setIndex(newIndex);
              }
            }
          }}
          renderIcon={({ route, color }) => (
            <MaterialCommunityIcons name={route.icon} size={28} color={color} />
          )}
          getLabelText={({ route }) => route.title}
          activeColor={theme.colors.primary}
          inactiveColor={theme.colors.onSurfaceDisabled}
          style={styles.bottomBar}
          theme={{
            colors: {
              secondaryContainer: theme.colors.surface,
              onSecondaryContainer: theme.colors.primary,
            },
          }}
        />

        <Button
          mode="contained"
          style={styles.applyButton}
          onPress={calculateShortestRoute}
        >
          Uygula
        </Button>

        <GeziModal
          visible={geziModalVisible}
          onClose={handleModalClose}
          selectedPlaces={selectedPlaces}
          setSelectedPlaces={setSelectedPlaces}
        />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomBar: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderTopWidth: 0,
    backgroundColor: 'white',
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  applyButton: {
    position: 'absolute',
    bottom: 120,
    left: '18%',
    transform: [{ translateX: -50 }],
    width: '30%',
  },
});