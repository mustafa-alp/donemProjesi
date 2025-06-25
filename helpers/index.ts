import { Route } from "@/app/(tabs)/_layout";
import { Dispatch, SetStateAction } from "react";
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { randomUUID } from "expo-crypto";
import { Alert } from "react-native";
import { firebaseDatabase } from "@/firebaseConfig";

function euclideanDistance(
  start: { latitude: number; longitude: number } | null,
  end: { latitude: number; longitude: number } | null
): number {
  if (!start || !end) {
    return Infinity;
  }
  const dx = start.latitude - end.latitude;
  const dy = start.longitude - end.longitude;
  return Math.sqrt(dx * dx + dy * dy);
}

export function decodePolyline(encoded: string) {
  let points = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;
  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
}

async function getRouteCoordinates(
  start: Record<string, any>,
  end: Record<string, any>
) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=AIzaSyDZn_6cOTwKR6QoxhAUwS0MvBspJwoNNpw&mode=walking&language=tr`
  );
  const data = await response.json();
  if (data.routes && data.routes[0]) {
    const points = data.routes[0].overview_polyline.points;
    return decodePolyline(points);
  }
  return [];
}

export const calculateShortestRoute = async (
  selectedPlaceLocations: Record<string, any>[],
  startLocation: Record<string, any>,
  endLocation: Record<string, any>,
  setRouteCoords: Dispatch<SetStateAction<Record<string, any>[]>>,
  setHasToggleApplyButton: Dispatch<SetStateAction<boolean>>
) => {
  if (selectedPlaceLocations.length < 2) {
    Alert.alert("Hata", "En az iki yer seçmelisiniz.");
    return;
  }
  setHasToggleApplyButton((prev) => !prev);

  const start = startLocation;
  const end = endLocation;
  const places = selectedPlaceLocations;

  let routeCoords: Array<{ latitude: number; longitude: number }> = [];
  let remainingPlaces = [...places];
  let currentLocation = start;

  remainingPlaces.sort(
    (a, b) =>
      euclideanDistance(currentLocation, a) -
      euclideanDistance(currentLocation, b)
  );

  for (let i = 0; i < remainingPlaces.length; i++) {
    const nextPlace = remainingPlaces[i];

    const segmentCoords = await getRouteCoordinates(currentLocation, nextPlace);
    routeCoords = [...routeCoords, ...segmentCoords]; // Append the new segment to the route

    currentLocation = nextPlace;
  }

  const finalSegmentCoords = await getRouteCoordinates(currentLocation, end);
  routeCoords = [...routeCoords, ...finalSegmentCoords];

  setRouteCoords(routeCoords);
};

export const fetchNearbyPlaces = async (
  selectedPlaces: string[],
  setPlaceLocations: Dispatch<SetStateAction<Record<string, any>[]>>,
  setLoadingPlaces: Dispatch<SetStateAction<boolean>>,
  GOOGLE_PLACES_API_KEY: string
) => {
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

      if (data.status === "OK" && data.results) {
        const places = data.results.map((place: any) => ({
          name: place.name,
          type: place.types[0],
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
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

export const handleSubmit = async (
  startLocation: Record<string, any>,
  endLocation: Record<string, any>,
  GOOGLE_PLACES_API_KEY: string,
  setRouteCoords: Dispatch<SetStateAction<Record<string, any>[]>>,
  selectedPlaces: Record<string, any>[],
  setPlaceLocations: Dispatch<SetStateAction<Record<string, any>[]>>,
  setModelTxt: Dispatch<SetStateAction<boolean>>
) => {
  if (!startLocation || !endLocation) {
    Alert.alert("Hata", "Başlangıç veya bitiş konumu seçilmemiş.");
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

        if (data.status === "OK" && data.results) {
          const places = data.results.map((place: any) => ({
            name: place.name,
            type: place.types[0],
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }));
          allPlaces.push(...places);
        }
      }
      setPlaceLocations(allPlaces);
    }

    setModelTxt(false);
  } catch (error) {
    console.error("Error:", error);
    Alert.alert("Hata", "İşlem sırasında bir hata oluştu.");
  }
};

export const startSelectingLocations = (
  setSelectingLocation: Dispatch<SetStateAction<boolean>>,
  selectingLocation: boolean,
  setSelectingStart: Dispatch<SetStateAction<boolean>>,
  selectingStart: boolean,
  setSelectingEnd: Dispatch<SetStateAction<boolean>>,
  selelectingEnd: boolean,
  setModelTxt: Dispatch<SetStateAction<boolean>>,
  modelTxt: boolean
) => {
  setSelectingLocation(selectingLocation);
  setSelectingStart(selectingStart);
  setSelectingEnd(selelectingEnd);
  setModelTxt(modelTxt);
};

export const confirmPlaceSelection = (
  currentPlace: Record<string, any> | null,
  selectedPlaceLocations: Record<string, any>[],
  setSelectedPlaceLocations: Dispatch<SetStateAction<Record<string, any>[]>>,
  setShowPlaceDialog: Dispatch<SetStateAction<boolean>>,
  setCurrentPlace: Dispatch<SetStateAction<Record<string, any> | null>>
) => {
  if (currentPlace) {
    const updatedPlaces = [...selectedPlaceLocations, currentPlace];
    setSelectedPlaceLocations(updatedPlaces);
  }
  setShowPlaceDialog(false);
  setCurrentPlace(null);
};

export const routes: Route[] = [
  { key: "home", title: "Ana Sayfa", icon: "home" },
  { key: "trip", title: "Mekanlar", icon: "map-marker" },
  { key: "List", title: "Liste", icon: "view-list" },
];

export const getMarkerColor = (
  place: {
    latitude: number;
    longitude: number;
    name: string;
    type: string;
  },
  selectedPlaceLocations: Record<string, any>[]
) => {
  // Eğer yer seçili yerler listesinde varsa siyah renk döndür
  const isSelected = selectedPlaceLocations.some(
    (selectedPlace) =>
      selectedPlace.latitude === place.latitude &&
      selectedPlace.longitude === place.longitude
  );

  if (isSelected) {
    return "#000000"; // Siyah renk
  }

  // Seçili değilse normal renk döndür
  switch (place.type) {
    case "restaurant":
      return "#FF5252"; // Kırmızı
    case "cafe":
      return "#FF9800"; // Turuncu
    case "museum":
      return "#2196F3"; // Mavi
    case "park":
      return "#4CAF50"; // Yeşil
    case "shopping_mall":
      return "#FFC107"; // Sarı
    case "tourist_attraction":
      return "#00BCD4"; // Turkuaz
    default:
      return "#9E9E9E"; // Gri
  }
};
export const getMarkerIcon = (type: string) => {
  switch (type) {
    case "restaurant":
      return "silverware-fork-knife"; // MaterialCommunityIcons
    case "cafe":
      return "coffee";
    case "museum":
      return "bank";
    case "park":
      return "tree";
    case "shopping_mall":
      return "shopping";
    case "tourist_attraction":
      return "star";
    default:
      return "map-marker";
  }
};

type ISelectedPlaceLocation = {
  latitude: number;
  longitude: number;
  name: string;
  type: string;
};

type ILocation = {
  latitude: number;
  longitude: number;
} | null;

export const addItemsToFirebase = async (
  routeName: string,
  endLocation: ILocation,
  startLocation: ILocation,
  selectedPlaceLocations: ISelectedPlaceLocation[],
  setSaveModalVisible: Dispatch<SetStateAction<boolean>>,
  setRouteName: Dispatch<SetStateAction<string>>
) => {
  try {
    const uuid = randomUUID();
    await setDoc(doc(firebaseDatabase, "locations", uuid), {
      name: routeName,
      endLocation,
      startLocation,
      selectedPlaceLocations,
    });
    Alert.alert("Rota Kaydedildi", `Rota adı: ${routeName}`);
  } catch (error) {
    console.log(error);
    Alert.alert("Bir hata meydana geldi.");
  } finally {
    setSaveModalVisible(false);
    setRouteName("");
  }
};
export const deleteLocation = async (id: string) => {
  try {
    await deleteDoc(doc(firebaseDatabase, "locations", id));
  } catch (error) {
    console.log(error);
    throw new Error("Rota silinirken bir hata oluştu.");
  }
};

export const fetchData = async (
  setData: Dispatch<SetStateAction<Record<string, any>[]>>
) => {
  try {
    const querySnapshot = await getDocs(
      collection(firebaseDatabase, "locations")
    );
    const allLocationData: Record<string, any>[] = [];

    querySnapshot.forEach((doc) => {
      allLocationData.push({ id: doc.id, ...doc.data() });
    });
    setData(allLocationData);
  } catch (error) {
    console.log(error);
    throw new Error("Veriler yüklenirken bir hata oluştu.");
  }
};

export const showSelectedLocation = (
  startLocation: ILocation,
  setStartLocation: Dispatch<SetStateAction<ILocation>>,
  endLocation: ILocation,
  setEndLocation: Dispatch<SetStateAction<ILocation>>,
  GOOGLE_PLACES_API_KEY: string,
  setRouteCoords: Dispatch<SetStateAction<ILocation>>,
  setModelTxt: Dispatch<SetStateAction<boolean>>,
  selectedPlaceLocations: ISelectedPlaceLocation[],
  setSelectedPlaceLocations: Dispatch<SetStateAction<ISelectedPlaceLocation[]>>,
  setHasToggleApplyButton: Dispatch<SetStateAction<boolean>>,
  setListModalVisible: Dispatch<SetStateAction<boolean>>
) => {
  setStartLocation(startLocation);
  setEndLocation(endLocation);

  if (selectedPlaceLocations.length) {
    console.log("if calisti");
    setSelectedPlaceLocations(selectedPlaceLocations);
    calculateShortestRoute(
      selectedPlaceLocations,
      startLocation,
      endLocation,
      setRouteCoords,
      setHasToggleApplyButton
    );
    setHasToggleApplyButton(true);
  } else {
    console.log("else calisti");
    setSelectedPlaceLocations([]);
    handleSubmit(
      startLocation,
      endLocation,
      GOOGLE_PLACES_API_KEY,
      setRouteCoords,
      [],
      [],
      setModelTxt
    );
  }
  setListModalVisible(false);
};
