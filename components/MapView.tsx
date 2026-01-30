import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
} from "react-native";
import RNMapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { AlertTriangle, Navigation, ZoomIn, ZoomOut, Plane } from "lucide-react-native";
import { MAJOR_AIRPORTS, Airport } from "@/constants/airports";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MapViewProps {
  onAirportSelect?: (airport: Airport) => void;
  userCountryCode?: string | null;
  originAirport?: Airport | null;
  destinationAirport?: Airport | null;
}

const INITIAL_REGION = {
  latitude: 30,
  longitude: 0,
  latitudeDelta: 100,
  longitudeDelta: 100,
};

export default function MapView({ onAirportSelect, userCountryCode, originAirport, destinationAirport }: MapViewProps) {
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const mapRef = useRef<RNMapView>(null);

  const handleAirportPress = useCallback((airport: Airport) => {
    console.log("[MapView] Airport selected:", airport.iata);
    setSelectedAirport(airport);
    onAirportSelect?.(airport);

    mapRef.current?.animateToRegion({
      latitude: airport.latitude,
      longitude: airport.longitude,
      latitudeDelta: 15,
      longitudeDelta: 15,
    }, 500);
  }, [onAirportSelect]);

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
    setSelectedAirport(null);
  }, []);

  const latToY = useCallback((lat: number) => {
    const mapHeight = SCREEN_HEIGHT * 0.55;
    return ((90 - lat) / 180) * mapHeight;
  }, []);

  const lonToX = useCallback((lon: number) => {
    const mapWidth = SCREEN_WIDTH - 32;
    return ((lon + 180) / 360) * mapWidth;
  }, []);

  const getArcPoints = useCallback((start: Airport, end: Airport) => {
    const points = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = start.latitude + (end.latitude - start.latitude) * t;
      const lon = start.longitude + (end.longitude - start.longitude) * t;
      const arc = Math.sin(t * Math.PI) * 30;
      points.push({ x: lonToX(lon), y: latToY(lat) - arc });
    }
    return points;
  }, [latToY, lonToX]);

  if (Platform.OS === "web") {
    const arcPoints = originAirport && destinationAirport ? getArcPoints(originAirport, destinationAirport) : [];
    const pathD = arcPoints.length > 0 
      ? `M ${arcPoints[0].x} ${arcPoints[0].y} ` + arcPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
      : '';

    const arrowAngle = arcPoints.length > 1 
      ? Math.atan2(
          arcPoints[arcPoints.length - 1].y - arcPoints[arcPoints.length - 2].y,
          arcPoints[arcPoints.length - 1].x - arcPoints[arcPoints.length - 2].x
        ) * (180 / Math.PI)
      : 0;

    return (
      <View style={styles.container}>
        <View style={styles.webMapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>World Map</Text>
            <Text style={styles.mapSubtitle}>Tap an airport to select</Text>
          </View>

          <View style={styles.mapArea}>
            <View style={styles.mapGrid}>
              {[...Array(7)].map((_, i) => (
                <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 12.5}%` }]} />
              ))}
              {[...Array(11)].map((_, i) => (
                <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 8.33}%` }]} />
              ))}
            </View>

            {MAJOR_AIRPORTS.map((airport) => {
              const x = lonToX(airport.longitude);
              const y = latToY(airport.latitude);
              const isSelected = selectedAirport?.iata === airport.iata;
              const isOrigin = originAirport?.iata === airport.iata;
              const isDestination = destinationAirport?.iata === airport.iata;
              const isUserCountry = userCountryCode && airport.countryCode === userCountryCode;
              
              let dotColor = "#00D4FF";
              if (!airport.operational) dotColor = "#FF4444";
              else if (isOrigin) dotColor = "#4ADE80";
              else if (isDestination) dotColor = "#FFB800";
              else if (isUserCountry) dotColor = "#4ADE80";

              return (
                <TouchableOpacity
                  key={airport.iata}
                  style={[
                    styles.mapDot,
                    { left: x - 6, top: y - 6, backgroundColor: dotColor },
                    (isSelected || isOrigin || isDestination) && styles.mapDotSelected,
                  ]}
                  onPress={() => handleAirportPress(airport)}
                  activeOpacity={0.7}
                >
                  {(isSelected || isOrigin || isDestination) && (
                    <View style={styles.mapDotLabel}>
                      <Text style={styles.mapDotLabelText}>{airport.iata}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {originAirport && destinationAirport && arcPoints.length > 0 && (
              <>
                <svg
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4ADE80" />
                      <stop offset="100%" stopColor="#FFB800" />
                    </linearGradient>
                  </defs>
                  <path
                    d={pathD}
                    stroke="url(#routeGradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="8,4"
                  />
                </svg>
                <View 
                  style={[
                    styles.planeIcon,
                    { 
                      left: arcPoints[Math.floor(arcPoints.length / 2)].x - 12,
                      top: arcPoints[Math.floor(arcPoints.length / 2)].y - 12,
                      transform: [{ rotate: `${arrowAngle}deg` }],
                    }
                  ]}
                >
                  <Plane size={24} color="#00D4FF" fill="#00D4FF" />
                </View>
              </>
            )}
          </View>

          {originAirport && destinationAirport && (
            <View style={styles.routeInfo}>
              <View style={styles.routeEndpoint}>
                <View style={[styles.routeDot, { backgroundColor: "#4ADE80" }]} />
                <View>
                  <Text style={styles.routeIata}>{originAirport.iata}</Text>
                  <Text style={styles.routeCity}>{originAirport.city}</Text>
                </View>
              </View>
              <View style={styles.routeArrowContainer}>
                <View style={styles.routeLine} />
                <Plane size={20} color="#00D4FF" />
                <View style={styles.routeLine} />
              </View>
              <View style={styles.routeEndpoint}>
                <View style={[styles.routeDot, { backgroundColor: "#FFB800" }]} />
                <View>
                  <Text style={styles.routeIata}>{destinationAirport.iata}</Text>
                  <Text style={styles.routeCity}>{destinationAirport.city}</Text>
                </View>
              </View>
            </View>
          )}

          {selectedAirport && (
            <View style={styles.selectedInfo}>
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedIata}>{selectedAirport.iata}</Text>
                <Text style={styles.selectedCity}>{selectedAirport.city}</Text>
              </View>
              <Text style={styles.selectedName}>{selectedAirport.name}</Text>
              <Text style={styles.selectedCountry}>{selectedAirport.country}</Text>
            </View>
          )}

          <View style={styles.webLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#00D4FF" }]} />
              <Text style={styles.legendText}>Airports</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#4ADE80" }]} />
              <Text style={styles.legendText}>Origin</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#FFB800" }]} />
              <Text style={styles.legendText}>Destination</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

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

        {originAirport && destinationAirport && (
          <Polyline
            coordinates={[
              { latitude: originAirport.latitude, longitude: originAirport.longitude },
              { latitude: destinationAirport.latitude, longitude: destinationAirport.longitude },
            ]}
            strokeColor="#00D4FF"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
            geodesic={true}
          />
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

      {selectedAirport && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoLeft}>
              <View style={[styles.statusDot, { backgroundColor: selectedAirport.operational ? "#4ADE80" : "#FF4444" }]} />
              <Text style={styles.infoIata}>{selectedAirport.iata}</Text>
            </View>
            {!selectedAirport.operational && (
              <View style={styles.closedBadge}>
                <AlertTriangle size={12} color="#FF4444" />
                <Text style={styles.closedText}>CLOSED</Text>
              </View>
            )}
          </View>
          <Text style={styles.infoCity}>{selectedAirport.city}</Text>
          <Text style={styles.infoName}>{selectedAirport.name}</Text>
          <Text style={styles.infoCountry}>{selectedAirport.country}</Text>
          {selectedAirport.closureReason && (
            <Text style={styles.closureReason}>{selectedAirport.closureReason}</Text>
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
  webMapContainer: {
    flex: 1,
    backgroundColor: "#0A1628",
  },
  mapHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.15)",
  },
  mapTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  mapSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  mapArea: {
    flex: 1,
    margin: 16,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
    overflow: "hidden",
    position: "relative" as const,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0, 212, 255, 0.05)",
  },
  gridLineV: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(0, 212, 255, 0.05)",
  },
  mapDot: {
    position: "absolute" as const,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  mapDotSelected: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderColor: "#FFFFFF",
    zIndex: 10,
  },
  mapDotLabel: {
    position: "absolute" as const,
    top: -24,
    left: -12,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  mapDotLabelText: {
    color: "#00D4FF",
    fontSize: 10,
    fontWeight: "700" as const,
  },
  planeIcon: {
    position: "absolute" as const,
    zIndex: 5,
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 212, 255, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
  },
  routeEndpoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeIata: {
    color: "#00D4FF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  routeCity: {
    color: "#94A3B8",
    fontSize: 11,
  },
  routeArrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    gap: 8,
  },
  routeLine: {
    width: 20,
    height: 2,
    backgroundColor: "rgba(0, 212, 255, 0.4)",
  },
  selectedInfo: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  selectedIata: {
    color: "#00D4FF",
    fontSize: 20,
    fontWeight: "800" as const,
  },
  selectedCity: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  selectedName: {
    color: "#94A3B8",
    fontSize: 12,
  },
  selectedCountry: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  webLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 212, 255, 0.15)",
  },
});
