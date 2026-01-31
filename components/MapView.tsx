import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { Search, Plane } from "lucide-react-native";
import RNMapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { AlertTriangle, Navigation, ZoomIn, ZoomOut } from "lucide-react-native";
import { MAJOR_AIRPORTS, Airport } from "@/constants/airports";

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
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<RNMapView>(null);

  const filteredAirports = useMemo(() => {
    if (!searchQuery.trim()) return MAJOR_AIRPORTS;
    const query = searchQuery.toLowerCase();
    return MAJOR_AIRPORTS.filter(
      (airport) =>
        airport.iata.toLowerCase().includes(query) ||
        airport.city.toLowerCase().includes(query) ||
        airport.country.toLowerCase().includes(query) ||
        airport.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);


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

  if (Platform.OS === "web") {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webHeader}>
          <Text style={styles.webTitle}>Select Airport</Text>
          <View style={styles.searchContainer}>
            <Search size={18} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search airports..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {originAirport && destinationAirport && (
          <View style={styles.routeIndicator}>
            <View style={styles.routeAirport}>
              <Text style={styles.routeIata}>{originAirport.iata}</Text>
              <Text style={styles.routeCity}>{originAirport.city}</Text>
            </View>
            <View style={styles.routeArrow}>
              <Plane size={20} color="#00D4FF" />
            </View>
            <View style={styles.routeAirport}>
              <Text style={styles.routeIata}>{destinationAirport.iata}</Text>
              <Text style={styles.routeCity}>{destinationAirport.city}</Text>
            </View>
          </View>
        )}

        <ScrollView style={styles.airportList} showsVerticalScrollIndicator={false}>
          {filteredAirports.map((airport) => {
            const isOrigin = originAirport?.iata === airport.iata;
            const isDestination = destinationAirport?.iata === airport.iata;
            const isSelected = selectedAirport?.iata === airport.iata;
            const dotColor = !airport.operational
              ? "#FF4444"
              : userCountryCode && airport.countryCode === userCountryCode
              ? "#4ADE80"
              : "#00D4FF";

            return (
              <TouchableOpacity
                key={airport.iata}
                style={[
                  styles.airportItem,
                  isSelected && styles.airportItemSelected,
                  isOrigin && styles.airportItemOrigin,
                  isDestination && styles.airportItemDestination,
                  !airport.operational && styles.airportItemClosed,
                ]}
                onPress={() => handleAirportPress(airport)}
                activeOpacity={0.7}
              >
                <View style={styles.airportItemLeft}>
                  <View style={[styles.airportDot, { backgroundColor: dotColor }]} />
                  <View>
                    <View style={styles.airportItemHeader}>
                      <Text style={styles.airportIata}>{airport.iata}</Text>
                      {isOrigin && <Text style={styles.originBadge}>ORIGIN</Text>}
                      {isDestination && <Text style={styles.destBadge}>DEST</Text>}
                    </View>
                    <Text style={styles.airportCity}>{airport.city}</Text>
                    <Text style={styles.airportName}>{airport.name}</Text>
                  </View>
                </View>
                <View style={styles.airportItemRight}>
                  <Text style={styles.airportCountry}>{airport.country}</Text>
                  {!airport.operational && (
                    <View style={styles.closedBadgeSmall}>
                      <Text style={styles.closedTextSmall}>CLOSED</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.webLegend}>
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
  webContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  webHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.15)",
  },
  webTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 12,
  },
  routeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 212, 255, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  routeAirport: {
    alignItems: "center",
    flex: 1,
  },
  routeIata: {
    color: "#00D4FF",
    fontSize: 20,
    fontWeight: "800" as const,
  },
  routeCity: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  routeArrow: {
    paddingHorizontal: 16,
  },
  routeArrowText: {
    fontSize: 18,
  },
  airportList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  airportItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
  },
  airportItemSelected: {
    borderColor: "rgba(0, 212, 255, 0.5)",
    backgroundColor: "rgba(0, 212, 255, 0.1)",
  },
  airportItemOrigin: {
    borderColor: "rgba(74, 222, 128, 0.5)",
    backgroundColor: "rgba(74, 222, 128, 0.1)",
  },
  airportItemDestination: {
    borderColor: "rgba(255, 184, 0, 0.5)",
    backgroundColor: "rgba(255, 184, 0, 0.1)",
  },
  airportItemClosed: {
    opacity: 0.6,
  },
  airportItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  airportDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  airportItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  airportIata: {
    color: "#00D4FF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  originBadge: {
    color: "#4ADE80",
    fontSize: 10,
    fontWeight: "700" as const,
    backgroundColor: "rgba(74, 222, 128, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  destBadge: {
    color: "#FFB800",
    fontSize: 10,
    fontWeight: "700" as const,
    backgroundColor: "rgba(255, 184, 0, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  airportCity: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  airportName: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 1,
  },
  airportItemRight: {
    alignItems: "flex-end",
  },
  airportCountry: {
    color: "#94A3B8",
    fontSize: 12,
  },
  closedBadgeSmall: {
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  closedTextSmall: {
    color: "#FF4444",
    fontSize: 9,
    fontWeight: "700" as const,
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
