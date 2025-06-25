import React, { useState } from "react";
import { View, StyleSheet, Modal } from "react-native";
import {
  BottomNavigation,
  Provider,
  Text,
  useTheme,
  Button,
} from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import HomeScreen from "./index";
import GeziModal from "./components/GeziModal";
import { routes } from "@/helpers";

export interface Route {
  key: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export default function TabLayout() {
  // KONTROL ET: birçok kullanilmayan state.
  const [index, setIndex] = useState(0);
  const theme = useTheme();
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [geziModalVisible, setGeziModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);

  const handleClear = () => {
    setSelectedPlaces([]);
    setGeziModalVisible(false);
  };

  const renderScene = ({ route }: { route: Route }) => {
    switch (route.key) {
      case "home":
        return (
          <HomeScreen
            selectedPlaces={selectedPlaces}
            setSelectedPlaces={setSelectedPlaces}
            listModalVisible={listModalVisible}
            setListModalVisible={setListModalVisible}
          />
        );
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

  const handleListPress = () => {
    setListModalVisible(true);
  };

  return (
    <Provider>
      <View style={styles.container}>
        {renderScene({ route: routes[index] })}

        <BottomNavigation.Bar
          navigationState={{ index, routes }}
          onTabPress={({ route }) => {
            if (route.key === "trip") {
              handleTripPress();
            } else if (route.key === "List") {
              handleListPress();
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

        <GeziModal
          visible={geziModalVisible}
          onClose={handleModalClose}
          selectedPlaces={selectedPlaces}
          setSelectedPlaces={setSelectedPlaces}
          handleClear={handleClear}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderTopWidth: 0,
    backgroundColor: "white",
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
  },
  applyButton: {
    position: "absolute",
    bottom: 120,
    left: "18%",
    transform: [{ translateX: -50 }],
    width: "30%",
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
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
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
  fullWidthButton: {
    marginTop: 10,
    borderRadius: 12,
    width: "100%",
  },
});
