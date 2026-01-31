import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import RNMapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { AlertTriangle, Navigation, ZoomIn, ZoomOut, Plane } from "lucide-react-native";
import { MAJOR_AIRPORTS, Airport } from "@/constants/airports";

interface MapViewProps {
  onAirportSelect?: (airport: Airport) => void;
  userCountryCode?: string | null;
  originAirport?: Airport | null;
  destinationAirport?: Airport | null;
  isSelectingDestination?: boolean;
}

const INITIAL_REGION = {
  latitude: 30,
  longitude: 0,
  latitudeDelta: 100,
  longitudeDelta: 100,
};

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - 
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function getArcCoordinates(origin: Airport, destination: Airport, numPoints: number = 50) {
  const coords = [];
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const lat = origin.latitude + (destination.latitude - origin.latitude) * fraction;
    const lon = origin.longitude + (destination.longitude - origin.longitude) * fraction;
    coords.push({ latitude: lat, longitude: lon });
  }
  return coords;
}

export default function MapView({ onAirportSelect, userCountryCode, originAirport, destinationAirport, isSelectingDestination }: MapViewProps) {
  const [tappedAirport, setTappedAirport] = useState<Airport | null>(null);
  const mapRef = useRef<RNMapView>(null);

  const routeData = useMemo(() => {
    if (!originAirport || !destinationAirport) return null;
    
    const arcCoords = getArcCoordinates(originAirport, destinationAirport);
    const bearing = calculateBearing(
      originAirport.latitude,
      originAirport.longitude,
      destinationAirport.latitude,
      destinationAirport.longitude
    );
    
    const arrowPoint = arcCoords[Math.floor(arcCoords.length * 0.7)];
    
    return {
      arcCoords,
      bearing,
      arrowPoint,
    };
  }, [originAirport, destinationAirport]);

  const handleAirportPress = useCallback((airport: Airport) => {
    console.log("[MapView] Airport pressed:", airport.iata, "isSelectingDestination:", isSelectingDestination);
    setTappedAirport(airport);
    onAirportSelect?.(airport);

    mapRef.current?.animateToRegion({
      latitude: airport.latitude,
      longitude: airport.longitude,
      latitudeDelta: 15,
      longitudeDelta: 15,
    }, 500);
  }, [onAirportSelect, isSelectingDestination]);

  const getMarkerColor = useCallback((airport: Airport): string => {
    if (!airport.operational) return "#FF4444";
    if (userCountryCode && airport.countryCode === userCountryCode) return "#4ADE80";
    return "#00D4FF";
  }, [userCountryCode]);

  const zoomIn = useCallback(() => {
    mapRef.current?.getCamera().then((camera) => {
      if (camera) {
        mapRef.current?.animateCamera({
          ...camera,
          zoom: (camera.zoom || 1) + 1,
        }, { duration: 300 });
      }
    });
  }, []);

  const zoomOut = useCallback(() => {
    mapRef.current?.getCamera().then((camera) => {
      if (camera) {
        mapRef.current?.animateCamera({
          ...camera,
          zoom: Math.max((camera.zoom || 1) - 1, 1),
        }, { duration: 300 });
      }
    });
  }, []);

  const resetView = useCallback(() => {
    mapRef.current?.animateToRegion(INITIAL_REGION, 500);
    setTappedAirport(null);
  }, []);

  return (
    <View style={styles.container}>
      <RNMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        mapType="standard"
        showsUserLocation={true}
        showsMyLocationButton={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {MAJOR_AIRPORTS.map((airport) => {
          const markerColor = getMarkerColor(airport);

          return (
            <Marker
              key={airport.iata}
              identifier={airport.iata}
              coordinate={{
                latitude: airport.latitude,
                longitude: airport.longitude,
              }}
              title={`${airport.iata} - ${airport.city}`}
              description={airport.operational ? airport.name : `CLOSED: ${airport.closureReason}`}
              onPress={() => handleAirportPress(airport)}
              pinColor={markerColor}
              tracksViewChanges={false}
            />
          );
        })}

        {routeData && originAirport && destinationAirport && (
          <>
            <Polyline
              coordinates={routeData.arcCoords}
              strokeColor="#00D4FF"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
              geodesic={true}
            />
            
            <Marker
              coordinate={{
                latitude: originAirport.latitude,
                longitude: originAirport.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.originMarker}>
                <View style={styles.originDot} />
              </View>
            </Marker>

            <Marker
              coordinate={routeData.arrowPoint}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[styles.arrowContainer, { transform: [{ rotate: `${routeData.bearing - 90}deg` }] }]}>
                <Plane size={20} color="#00D4FF" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
            </Marker>

            <Marker
              coordinate={{
                latitude: destinationAirport.latitude,
                longitude: destinationAirport.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.destinationMarker}>
                <View style={styles.destinationInner} />
              </View>
            </Marker>
          </>
        )}
      </RNMapView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#00D4FF" }]} />
          <Text style={styles.legendText}>Airports</Text>
        </View>
        {userCountryCode && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4ADE80" }]} />
            <Text style={styles.legendText}>Your country</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FF4444" }]} />
          <Text style={styles.legendText}>Closed</Text>
        </View>
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={zoomIn} activeOpacity={0.7}>
          <ZoomIn size={20} color="#00D4FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={zoomOut} activeOpacity={0.7}>
          <ZoomOut size={20} color="#00D4FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={resetView} activeOpacity={0.7}>
          <Navigation size={18} color="#00D4FF" />
        </TouchableOpacity>
      </View>

      {tappedAirport && !originAirport && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoLeft}>
              <View style={[styles.statusDot, { backgroundColor: tappedAirport.operational ? "#4ADE80" : "#FF4444" }]} />
              <Text style={styles.infoIata}>{tappedAirport.iata}</Text>
            </View>
            {!tappedAirport.operational && (
              <View style={styles.closedBadge}>
                <AlertTriangle size={12} color="#FF4444" />
                <Text style={styles.closedText}>CLOSED</Text>
              </View>
            )}
          </View>
          <Text style={styles.infoCity}>{tappedAirport.city}</Text>
          <Text style={styles.infoName}>{tappedAirport.name}</Text>
          <Text style={styles.infoCountry}>{tappedAirport.country}</Text>
          {tappedAirport.closureReason && (
            <Text style={styles.closureReason}>{tappedAirport.closureReason}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  legend: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    gap: 16,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    top: 120,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  infoCard: {
    position: "absolute",
    bottom: 70,
    left: 16,
    right: 16,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.15)",
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoIata: {
    color: "#00D4FF",
    fontSize: 24,
    fontWeight: "800" as const,
    letterSpacing: 1,
  },
  closedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  closedText: {
    color: "#FF4444",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  infoCity: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600" as const,
  },
  infoName: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
  },
  infoCountry: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  closureReason: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 10,
    fontStyle: "italic" as const,
    lineHeight: 18,
  },
  originMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 212, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#00D4FF",
  },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00D4FF",
  },
  arrowContainer: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#00D4FF",
  },
  destinationMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(74, 222, 128, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
  },
  destinationInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4ADE80",
  },
});
