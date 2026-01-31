import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  PanResponder,
  Animated,
} from "react-native";
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

const STATIC_MAP_URL = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=2560&q=80";

const MAP_WIDTH = 2560;
const MAP_HEIGHT = 1280;

function latLngToPixel(lat: number, lng: number, scale: number, offsetX: number, offsetY: number) {
  const x = ((lng + 180) / 360) * MAP_WIDTH * scale + offsetX;
  const y = ((90 - lat) / 180) * MAP_HEIGHT * scale + offsetY;
  return { x, y };
}

function WebMapView({ onAirportSelect, userCountryCode, originAirport, destinationAirport }: MapViewProps) {
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pulseAnim] = useState(new Animated.Value(0));
  
  const lastPanRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleAirportPress = useCallback((airport: Airport) => {
    console.log("[WebMapView] Airport selected:", airport.iata);
    setSelectedAirport(airport);
    onAirportSelect?.(airport);
  }, [onAirportSelect]);

  const getMarkerColor = useCallback((airport: Airport): string => {
    if (!airport.operational) return "#FF4444";
    if (userCountryCode && airport.countryCode === userCountryCode) return "#4ADE80";
    return "#00D4FF";
  }, [userCountryCode]);

  const getMarkerSize = useCallback((airport: Airport): number => {
    if (originAirport?.iata === airport.iata) return 16;
    if (destinationAirport?.iata === airport.iata) return 16;
    if (selectedAirport?.iata === airport.iata) return 14;
    return 10;
  }, [originAirport, destinationAirport, selectedAirport]);

  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
    
    const scaleX = width / MAP_WIDTH;
    const scaleY = height / MAP_HEIGHT;
    const initialScale = Math.max(scaleX, scaleY) * 1.2;
    setScale(initialScale);
    
    const scaledWidth = MAP_WIDTH * initialScale;
    const scaledHeight = MAP_HEIGHT * initialScale;
    setOffset({
      x: (width - scaledWidth) / 2,
      y: (height - scaledHeight) / 2,
    });
  }, []);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.3, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.3, 0.5));
  }, []);

  const resetView = useCallback(() => {
    const scaleX = containerSize.width / MAP_WIDTH;
    const scaleY = containerSize.height / MAP_HEIGHT;
    const initialScale = Math.max(scaleX, scaleY) * 1.2;
    setScale(initialScale);
    
    const scaledWidth = MAP_WIDTH * initialScale;
    const scaledHeight = MAP_HEIGHT * initialScale;
    setOffset({
      x: (containerSize.width - scaledWidth) / 2,
      y: (containerSize.height - scaledHeight) / 2,
    });
    setSelectedAirport(null);
  }, [containerSize]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPanRef.current = { x: offset.x, y: offset.y };
        
      },
      onPanResponderMove: (_, gestureState) => {
        setOffset({
          x: lastPanRef.current.x + gestureState.dx,
          y: lastPanRef.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  useEffect(() => {
    lastPanRef.current = { x: offset.x, y: offset.y };
  }, [offset]);

  const renderFlightPath = useCallback(() => {
    if (!originAirport || !destinationAirport) return null;

    const start = latLngToPixel(originAirport.latitude, originAirport.longitude, scale, offset.x, offset.y);
    const end = latLngToPixel(destinationAirport.latitude, destinationAirport.longitude, scale, offset.x, offset.y);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return (
      <View>
        <View
          style={{
            position: 'absolute',
            left: start.x,
            top: start.y - 3,
            width: distance,
            height: 8,
            backgroundColor: 'rgba(0, 212, 255, 0.15)',
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: 'left center',
            borderRadius: 4,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: start.x,
            top: start.y - 1,
            width: distance,
            height: 2,
            backgroundColor: '#00D4FF',
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: 'left center',
            borderRadius: 1,
            shadowColor: '#00D4FF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
          }}
        />
      </View>
    );
  }, [originAirport, destinationAirport, scale, offset]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.mapBackground} />
      
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Image
          source={{ uri: STATIC_MAP_URL }}
          style={{
            position: 'absolute',
            left: offset.x,
            top: offset.y,
            width: MAP_WIDTH * scale,
            height: MAP_HEIGHT * scale,
            opacity: 0.7,
          }}
          resizeMode="cover"
        />
        
        <View style={styles.mapOverlay} pointerEvents="none" />
        <View style={styles.gridOverlay} pointerEvents="none" />

        {renderFlightPath()}

        {MAJOR_AIRPORTS.map((airport) => {
          const pos = latLngToPixel(airport.latitude, airport.longitude, scale, offset.x, offset.y);
          const markerColor = getMarkerColor(airport);
          const markerSize = getMarkerSize(airport);
          const isSelected = selectedAirport?.iata === airport.iata;
          const isOrigin = originAirport?.iata === airport.iata;
          const isDestination = destinationAirport?.iata === airport.iata;
          const isHighlighted = isSelected || isOrigin || isDestination;

          if (pos.x < -20 || pos.x > containerSize.width + 20 || 
              pos.y < -20 || pos.y > containerSize.height + 20) {
            return null;
          }

          return (
            <View key={airport.iata} style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: isHighlighted ? 100 : 10 }}>
              {isHighlighted && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: -markerSize,
                    top: -markerSize,
                    width: markerSize * 2,
                    height: markerSize * 2,
                    borderRadius: markerSize,
                    backgroundColor: markerColor,
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  }}
                />
              )}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  left: -markerSize / 2,
                  top: -markerSize / 2,
                  width: markerSize,
                  height: markerSize,
                  borderRadius: markerSize / 2,
                  backgroundColor: markerColor,
                  borderWidth: isHighlighted ? 2 : 1.5,
                  borderColor: isOrigin ? '#4ADE80' : isDestination ? '#F59E0B' : 'rgba(255,255,255,0.8)',
                  shadowColor: markerColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: isHighlighted ? 12 : 6,
                  elevation: 5,
                }}
                onPress={() => handleAirportPress(airport)}
                activeOpacity={0.7}
              />
              {isHighlighted && (
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText}>{airport.iata}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotGlow, { backgroundColor: "#00D4FF" }]} />
            <Text style={styles.legendText}>Airports</Text>
          </View>
          {userCountryCode && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotGlow, { backgroundColor: "#4ADE80" }]} />
              <Text style={styles.legendText}>Your country</Text>
            </View>
          )}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
            <Text style={styles.legendText}>Closed</Text>
          </View>
        </View>
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={zoomIn} activeOpacity={0.7}>
          <ZoomIn size={18} color="#00D4FF" />
        </TouchableOpacity>
        <View style={styles.controlDivider} />
        <TouchableOpacity style={styles.controlButton} onPress={zoomOut} activeOpacity={0.7}>
          <ZoomOut size={18} color="#00D4FF" />
        </TouchableOpacity>
        <View style={styles.controlDivider} />
        <TouchableOpacity style={styles.controlButton} onPress={resetView} activeOpacity={0.7}>
          <Navigation size={16} color="#00D4FF" />
        </TouchableOpacity>
      </View>

      {selectedAirport && (
        <View style={styles.infoCard}>
          <View style={styles.infoCardGlow} />
          <View style={styles.infoCardInner}>
            <View style={styles.infoHeader}>
              <View style={styles.infoLeft}>
                <View style={[styles.statusIndicator, { backgroundColor: selectedAirport.operational ? "rgba(74, 222, 128, 0.2)" : "rgba(239, 68, 68, 0.2)" }]}>
                  <View style={[styles.statusDot, { backgroundColor: selectedAirport.operational ? "#4ADE80" : "#EF4444" }]} />
                </View>
                <Text style={styles.infoIata}>{selectedAirport.iata}</Text>
              </View>
              {!selectedAirport.operational && (
                <View style={styles.closedBadge}>
                  <AlertTriangle size={11} color="#EF4444" />
                  <Text style={styles.closedText}>CLOSED</Text>
                </View>
              )}
            </View>
            <Text style={styles.infoCity}>{selectedAirport.city}</Text>
            <Text style={styles.infoName}>{selectedAirport.name}</Text>
            <View style={styles.infoDivider} />
            <Text style={styles.infoCountry}>{selectedAirport.country}</Text>
            {selectedAirport.closureReason && (
              <View style={styles.closureReasonContainer}>
                <Text style={styles.closureReason}>{selectedAirport.closureReason}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function NativeMapView({ onAirportSelect, userCountryCode, originAirport, destinationAirport }: MapViewProps) {
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

export default function MapView(props: MapViewProps) {
  if (Platform.OS === 'web') {
    return <WebMapView {...props} />;
  }
  return <NativeMapView {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#030712',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.4)',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  legendContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
  },
  legend: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendDotGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  legendText: {
    color: "rgba(148, 163, 184, 0.9)",
    fontSize: 11,
    fontWeight: "500" as const,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    top: 100,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: 'hidden',
  },
  controlButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  controlDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginHorizontal: 8,
  },
  markerLabel: {
    position: 'absolute',
    top: 14,
    left: -20,
    width: 40,
    alignItems: 'center',
  },
  markerLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: "700" as const,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  infoCard: {
    position: "absolute",
    bottom: 60,
    left: 16,
    right: 16,
  },
  infoCardGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
  },
  infoCardInner: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoIata: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: 2,
  },
  closedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  closedText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  infoCity: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600" as const,
  },
  infoName: {
    color: "rgba(148, 163, 184, 0.8)",
    fontSize: 13,
    marginTop: 3,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 10,
  },
  infoCountry: {
    color: "rgba(100, 116, 139, 0.9)",
    fontSize: 12,
    fontWeight: "500" as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  closureReasonContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  closureReason: {
    color: "rgba(239, 68, 68, 0.9)",
    fontSize: 12,
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
