import React, { useEffect, useRef, useState } from 'react';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from 'expo-router';
import * as Location from 'expo-location';
import locations from '@/constants/Location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Define the geofencing task name
const GEOFENCING_TASK = 'GEOFENCING_TASK';

// Initial region for the map when it loads
const INITIAL_REGION = {
  latitude: 23.6850, // Centered on Bangladesh
  longitude: 90.3563,
  latitudeDelta: 5.0, // Zoom level for latitude
  longitudeDelta: 5.0, // Zoom level for longitude
};

export default function App() {
  // Reference to the MapView component
  const mapRef = useRef<MapView>(null);

  // Navigation hook for routing (if needed)
  const navigation = useNavigation();

  // State for user's current location
  const [currentLocation, setCurrentLocation] = useState(null);

  // State for search query input
  const [searchQuery, setSearchQuery] = useState('');

  // State for map type (standard, hybrid, terrain)
  const [mapType, setMapType] = useState('standard'); 

  // Key to force re-render of the map when map type changes
  const [mapKey, setMapKey] = useState(0);

  // State for destination coordinates
  const [destination, setDestination] = useState(null);

  // Effect to request location permissions and initialize geofencing
  useEffect(() => {
    (async () => {
      try {
        // Request foreground location permissions
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Location access is required to use this feature.');
          return;
        }

        // Request background location permissions for geofencing
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          Alert.alert('Background Permission Denied', 'Geofencing requires background location access.');
        }

        // Get the user's current location
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location?.coords);

        // Start geofencing with predefined locations
        Location.startGeofencingAsync(GEOFENCING_TASK, locations.map((loc) => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          radius: 500, // Radius for geofencing
        })));
      } catch (error) {
        Alert.alert('Error', 'Failed to initialize location services.');
        console.error(error);
      }
    })();
  }, []);

  // Handle location search based on the user's query
  const handleSearch = async () => {
    if (!searchQuery) {
      Alert.alert('Error', 'Please enter a location to search.');
      return;
    }

    try {
      // Geocode the search query to get latitude and longitude
      const geocodedLocation = await Location.geocodeAsync(searchQuery);
      if (geocodedLocation?.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        setDestination({ latitude, longitude }); // Set destination
        mapRef.current?.animateCamera({ center: { latitude, longitude }, zoom: 14 }); // Move camera to destination
      } else {
        Alert.alert('Error', 'Location not found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search location.');
    }
  };

  // Toggle between different map types
  const toggleMapType = () => {
    const types = ['standard', 'hybrid', 'terrain']; // Available map types
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]); // Update map type
    setMapKey((prevKey) => prevKey + 1); // Force re-render
    Alert.alert('Map Type Changed', `Map type is now set to: ${types[nextIndex]}`);
  };

  // Start navigation using Google Maps
  const startNavigation = () => {
    if (!currentLocation || !destination) {
      Alert.alert('Error', 'Both current location and destination are required.');
      return;
    }

    const { latitude: currentLat, longitude: currentLng } = currentLocation;
    const { latitude: destLat, longitude: destLng } = destination;

    // Open Google Maps with directions
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destLat},${destLng}&travelmode=driving`;
    Linking.openURL(googleMapsUrl).catch(() =>
      Alert.alert('Error', 'Failed to open Google Maps.')
    );
  };

  // Center the map to the user's current location
  const centerUserLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01, // Adjust for zoom level
          longitudeDelta: 0.01,
        },
        1000 // Animation duration in milliseconds
      );
    } else {
      Alert.alert('Error', 'Current location is not available.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top controls for search and map type */}
      <View style={styles.topControls}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for a location"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapTypeButton} onPress={toggleMapType}>
          <Text style={styles.buttonText}>Map Type</Text>
        </TouchableOpacity>
      </View>

      {/* Display user's current location */}
      <Text style={styles.locationText}>
        {currentLocation
          ? `Latitude: ${currentLocation?.latitude}, Longitude: ${currentLocation?.longitude}`
          : 'Fetching current location...'}
      </Text>

      {/* MapView component */}
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsIndoors
        showsTraffic
        showsBuildings
        mapType={mapType} // Dynamically set map type
        ref={mapRef}
      >
        {/* Marker for the destination */}
        {destination && (
          <Marker coordinate={destination}>
            <Callout>
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 16 }}>You are here</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* Button to start navigation */}
      {destination && (
        <TouchableOpacity style={styles.startButton} onPress={startNavigation}>
          <Text style={styles.startButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      )}

      {/* Button to center the user's location */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerUserLocation}
      >
        <MaterialIcons name="center-focus-strong" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}

// Styles for the components
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 5,
  },
  searchButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  mapTypeButton: {
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 16,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 1,
  },
  startButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
