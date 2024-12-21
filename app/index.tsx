import React, { useEffect, useRef, useState } from 'react';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from 'expo-router';
import * as Location from 'expo-location';
import locations from '@/constants/Location'; // Assuming locations includes lat, lng, and name
import * as TaskManager from 'expo-task-manager';

const GEOFENCING_TASK = 'GEOFENCING_TASK';

const INITIAL_REGION = {
  latitude: 23.6850,
  longitude: 90.3563,
  latitudeDelta: 5.0,
  longitudeDelta: 5.0,
};

export default function App() {
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapType, setMapType] = useState('standard'); 
  const [mapKey, setMapKey] = useState(0);
  const [destination, setDestination] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    (async () => {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        alert('Permission to access background location was denied');
      }

      // Fetch initial location
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);

      // Start geofencing
      Location.startGeofencingAsync(GEOFENCING_TASK, locations.map((loc) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: 500, // Adjust radius as needed
      })));
    })();

    // Periodically update location every 10 minutes
    const interval = setInterval(async () => {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, []);

   const handleSearch = async () => {
    if (!searchQuery) {
      Alert.alert('Error', 'Please enter a location to search.');
      return;
    }

    try {
      const geocodedLocation = await Location.geocodeAsync(searchQuery);
      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        setDestination({ latitude, longitude });
        mapRef.current?.animateCamera({ center: { latitude, longitude }, zoom: 14 });
      } else {
        Alert.alert('Error', 'Location not found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search location.');
    }
  };

  const toggleMapType = () => {
    const types = ['standard', 'hybrid', 'terrain'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
    setMapKey((prevKey) => prevKey + 1); 
    Alert.alert('Map Type Changed', `Map type is now set to: ${types[nextIndex]}`);
  };


  const startNavigation = () => {
    if (!currentLocation || !destination) {
      Alert.alert('Error', 'Both current location and destination are required.');
      return;
    }

    const { latitude: currentLat, longitude: currentLng } = currentLocation;
    const { latitude: destLat, longitude: destLng } = destination;

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destLat},${destLng}&travelmode=driving`;
    Linking.openURL(googleMapsUrl).catch(() =>
      Alert.alert('Error', 'Failed to open Google Maps.')
    );
  };


  return (
    <View style={styles.container}>
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
      <Text style={styles.locationText}>
        {currentLocation
          ? `Latitude: ${currentLocation.latitude}, Longitude: ${currentLocation.longitude}`
          : 'Fetching current location...'}
      </Text>
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
      {destination && (
        <TouchableOpacity style={styles.startButton} onPress={startNavigation}>
          <Text style={styles.startButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

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
    backgroundColor: '#FF6347',
    padding: 15,
    borderRadius: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



