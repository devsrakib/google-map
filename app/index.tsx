import React, { useEffect, useRef } from 'react';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    })();
}, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => focusMap()}>
          <View style={{ padding: 10 }}>
            <Text>Focus</Text>
          </View>
        </TouchableOpacity>
      ),
    });
  }, []);

  const focusMap = () => {
    const GreenBayStadium = {
      latitude: 44.5013,
      longitude: -88.0622,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    mapRef.current?.animateCamera(
      { center: GreenBayStadium, zoom: 10 },
      { duration: 3000 }
    );
  };

  const onRegionChange = (region: Region) => {
    console.log(region);
  };

  const onMarkerSelect = (marker: any) => {
    Alert.alert(marker.name);
  };

  const calloutPress = (data: any) => {
    console.log(data);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsIndoors
        showsTraffic
        showsBuildings
        onRegionChangeComplete={onRegionChange}
        mapType="hybrid"
        ref={mapRef}
      >
        {locations.map((l, i) => (
          <Marker key={i} coordinate={l}>
            <Callout onPress={calloutPress}>
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 24 }}>{l.name}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Define geofencing task
Location.startGeofencingAsync(GEOFENCING_TASK, locations.map((loc) => ({
  latitude: loc.latitude,
  longitude: loc.longitude,
  radius: 500, // Adjust radius as needed
})));

TaskManager.defineTask(GEOFENCING_TASK, ({ data, error }) => {
  if (error) {
    console.error('Geofencing error:', error);
    return;
  }
  if (data) {
    const { eventType, region } = data;
    if (eventType === Location.GeofencingEventType.Enter) {
      Alert.alert('Entered Region', `You entered ${region.identifier}`);
    } else if (eventType === Location.GeofencingEventType.Exit) {
      Alert.alert('Exited Region', `You exited ${region.identifier}`);
    }
  }
});
