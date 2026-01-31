import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageCircle, Map as MapIcon, X, MapPin, RotateCcw } from "lucide-react-native";
import MapView from "@/components/MapView";
import ChatInterface from "@/components/ChatInterface";
import { Airport, MAJOR_AIRPORTS } from "@/constants/airports";
import { Flight } from "@/services/aviationStack";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface LocationCoords {
  latitude: number;
  longitude: number;
}

function getCountryCodeFromCoords(coords: LocationCoords): string | null {
  let closestAirport: Airport | null = null;
  let minDistance = Infinity;

  for (const airport of MAJOR_AIRPORTS) {
    const distance = Math.sqrt(
      Math.pow(coords.latitude - airport.latitude, 2) +
      Math.pow(coords.longitude - airport.longitude, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestAirport = airport;
    }
  }

  return closestAirport?.countryCode || null;
}

export default function FlightSearchScreen() {
  const insets = useSafeAreaInsets();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [recentFlights, setRecentFlights] = useState<Flight[]>([]);
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null);
  const [isSelectingDestination, setIsSelectingDestination] = useState(false);
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const buttonGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestUserLocation();
  }, []);

  const requestUserLocation = async () => {
    if (locationRequested) return;
    setLocationRequested(true);

    try {
      if (Platform.OS === "web") {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log("[FlightSearch] Got web location:", position.coords);
              const countryCode = getCountryCodeFromCoords({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              console.log("[FlightSearch] Detected country code:", countryCode);
              setUserCountryCode(countryCode);
            },
            (error) => {
              console.log("[FlightSearch] Web geolocation error:", error.message);
            },
            { enableHighAccuracy: false, timeout: 10000 }
          );
        }
      } else {
        const Location = await import("expo-location");
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== "granted") {
          console.log("[FlightSearch] Location permission denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        
        console.log("[FlightSearch] Got native location:", location.coords);
        const countryCode = getCountryCodeFromCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log("[FlightSearch] Detected country code:", countryCode);
        setUserCountryCode(countryCode);
      }
    } catch (error) {
      console.log("[FlightSearch] Location error:", error);
    }
  };

  const chatHeight = useCallback(() => {
    return SCREEN_HEIGHT * 0.75;
  }, []);

  const startButtonPulse = useCallback(() => {
    buttonGlowAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(buttonPulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(buttonGlowAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(buttonPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(buttonGlowAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();
  }, [buttonPulseAnim, buttonGlowAnim]);

  const stopButtonPulse = useCallback(() => {
    buttonPulseAnim.stopAnimation();
    buttonGlowAnim.stopAnimation();
    buttonPulseAnim.setValue(1);
    buttonGlowAnim.setValue(0);
  }, [buttonPulseAnim, buttonGlowAnim]);

  const handleAirportSelect = useCallback((airport: Airport) => {
    console.log("[FlightSearch] Airport selected:", airport.iata, "isSelectingDestination:", isSelectingDestination, "currentOrigin:", selectedAirport?.iata);
    
    if (isSelectingDestination && selectedAirport) {
      if (airport.iata === selectedAirport.iata) {
        console.log("[FlightSearch] Cannot select same airport as origin and destination");
        return;
      }
      console.log("[FlightSearch] Destination selected:", airport.iata);
      setDestinationAirport(airport);
      setIsSelectingDestination(false);
    } else if (!isSelectingDestination) {
      setSelectedAirport(airport);
      setDestinationAirport(null);
      startButtonPulse();
    }
  }, [isSelectingDestination, selectedAirport, startButtonPulse]);

  const handleStartDestinationSelection = useCallback(() => {
    setIsSelectingDestination(true);
    stopButtonPulse();
  }, [stopButtonPulse]);

  const handleFlightsFound = useCallback((flights: Flight[]) => {
    console.log("[FlightSearch] Flights found:", flights.length);
    setRecentFlights(flights);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
    if (!isChatOpen) {
      stopButtonPulse();
    }
  }, [isChatOpen, stopButtonPulse]);

  const handleClearSelection = useCallback(() => {
    setSelectedAirport(null);
    setDestinationAirport(null);
    setIsSelectingDestination(false);
    stopButtonPulse();
  }, [stopButtonPulse]);

  const buttonBackgroundColor = buttonGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#00D4FF", "#00FFCC"],
  });

  const closedCount = MAJOR_AIRPORTS.filter(a => !a.operational).length;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView 
          onAirportSelect={handleAirportSelect} 
          userCountryCode={userCountryCode}
          originAirport={selectedAirport}
          destinationAirport={destinationAirport}
          isSelectingDestination={isSelectingDestination}
        />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>in a hurry</Text>
        <Text style={styles.subtitle}>Find your flight, fast</Text>
      </View>

      <View style={[styles.statsContainer, { bottom: insets.bottom + 90 }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MAJOR_AIRPORTS.length - closedCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#FF4444" }]}>{closedCount}</Text>
          <Text style={styles.statLabel}>Closed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {recentFlights.length > 0 ? recentFlights.length : "—"}
          </Text>
          <Text style={styles.statLabel}>Flights</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          {userCountryCode ? (
            <View style={styles.locationIndicator}>
              <MapPin size={14} color="#4ADE80" />
              <Text style={[styles.statValue, { color: "#4ADE80", fontSize: 16 }]}>{userCountryCode}</Text>
            </View>
          ) : (
            <Text style={styles.statValue}>—</Text>
          )}
          <Text style={styles.statLabel}>Location</Text>
        </View>
      </View>

      {selectedAirport && !isChatOpen && (
        <View style={[styles.quickAction, { bottom: insets.bottom + 160 }]}>
          {isSelectingDestination ? (
            <>
              <Text style={styles.quickActionText}>
                Now tap your destination airport on the map
              </Text>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleClearSelection}
                activeOpacity={0.7}
              >
                <RotateCcw size={14} color="#FF6B6B" />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </>
          ) : destinationAirport ? (
            <>
              <Text style={styles.quickActionText}>
                {selectedAirport.iata} → {destinationAirport.iata}
              </Text>
              <Text style={styles.quickActionSubtext}>
                {selectedAirport.city} to {destinationAirport.city}
              </Text>
              <View style={styles.quickActionButtons}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={handleClearSelection}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={14} color="#FF6B6B" />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.quickActionText}>
                {selectedAirport.operational 
                  ? `Origin: ${selectedAirport.iata} (${selectedAirport.city})`
                  : `${selectedAirport.iata} is currently closed`
                }
              </Text>
              <View style={styles.quickActionButtons}>
                {selectedAirport.operational && (
                  <TouchableOpacity 
                    style={styles.selectDestinationButton}
                    onPress={handleStartDestinationSelection}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectDestinationText}>Select destination</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={handleClearSelection}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={14} color="#FF6B6B" />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {!isChatOpen && (
        <Animated.View
          style={[
            styles.chatButtonWrapper,
            { bottom: insets.bottom + 20 },
            selectedAirport && !isSelectingDestination && {
              transform: [{ scale: buttonPulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.chatButton,
              selectedAirport && !isSelectingDestination && styles.chatButtonHighlight,
            ]}
            onPress={toggleChat}
            activeOpacity={0.8}
          >
            <Animated.View 
              style={[
                styles.chatButtonInner,
                selectedAirport && !isSelectingDestination && {
                  backgroundColor: buttonBackgroundColor,
                },
              ]}
            >
              <MessageCircle size={26} color="#0A1628" />
              <Text style={styles.chatButtonText}>
                {selectedAirport && destinationAirport 
                  ? `Search ${selectedAirport.iata} → ${destinationAirport.iata}`
                  : selectedAirport 
                    ? `Search from ${selectedAirport.iata}`
                    : "Search Flights"
                }
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View
        style={[
          styles.chatContainer,
          {
            height: chatHeight(),
            paddingBottom: insets.bottom,
          },
          !isChatOpen && styles.chatContainerHidden,
        ]}
        pointerEvents={isChatOpen ? "auto" : "none"}
      >
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <MapIcon size={20} color="#00D4FF" />
            <Text style={styles.chatHeaderTitle}>Flight Search</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={toggleChat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <ChatInterface 
            onFlightsFound={handleFlightsFound}
            originAirport={selectedAirport}
            destinationAirport={destinationAirport}
            onClearSelection={handleClearSelection}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050D1A",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(5, 13, 26, 0.7)",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#00D4FF",
    fontSize: 13,
    fontWeight: "500" as const,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  statsContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.15)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#00D4FF",
    fontSize: 20,
    fontWeight: "700" as const,
  },
  statLabel: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0, 212, 255, 0.2)",
  },
  locationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  quickAction: {
    position: "absolute",
    left: 20,
    right: 20,
    padding: 12,
    backgroundColor: "rgba(0, 212, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  quickActionText: {
    color: "#00D4FF",
    fontSize: 13,
    textAlign: "center",
  },
  selectDestinationButton: {
    marginTop: 10,
    backgroundColor: "rgba(0, 212, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "center",
  },
  selectDestinationText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  quickActionSubtext: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center" as const,
    marginTop: 4,
  },
  quickActionButtons: {
    flexDirection: "row" as const,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  resetButton: {
    flexDirection: "row" as const,
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    marginTop: 10,
  },
  resetButtonText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  chatButtonWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  chatButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  chatButtonHighlight: {
    shadowColor: "#00FFCC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  chatButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#00D4FF",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  chatButtonText: {
    color: "#0A1628",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  chatContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.1)",
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600" as const,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatContainerHidden: {
    opacity: 0,
    transform: [{ translateY: 1000 }],
  },
});
