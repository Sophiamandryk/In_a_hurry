import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  PanResponder,
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

const STATIC_MAP_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Equirectangular-projection.jpg/2560px-Equirectangular-projection.jpg";

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
  
  const lastPanRef = useRef({ x: 0, y: 0 });

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
      <View
        style={{
          position: 'absolute',
          left: start.x,
          top: start.y,
          width: distance,
          height: 3,
          backgroundColor: '#00D4FF',
          transform: [{ rotate: `${angle}deg` }],
          transformOrigin: 'left center',
          opacity: 0.8,
          borderRadius: 2,
          shadowColor: '#00D4FF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
        }}
      />
    );
  }, [originAirport, destinationAirport, scale, offset]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Image
          source={{ uri: STATIC_MAP_URL }}
          style={{
            position: 'absolute',
            left: offset.x,
            top: offset.y,
            width: MAP_WIDTH * scale,
            height: MAP_HEIGHT * scale,
          }}
          resizeMode="cover"
        />
        
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 22, 40, 0.6)' }]} pointerEvents="none" />

        {renderFlightPath()}

        {MAJOR_AIRPORTS.map((airport) => {
          const pos = latLngToPixel(airport.latitude, airport.longitude, scale, offset.x, offset.y);
          const markerColor = getMarkerColor(airport);
          const markerSize = getMarkerSize(airport);
          const isSelected = selectedAirport?.iata === airport.iata;
          const isOrigin = originAirport?.iata === airport.iata;
          const isDestination = destinationAirport?.iata === airport.iata;

          if (pos.x < -20 || pos.x > containerSize.width + 20 || 
              pos.y < -20 || pos.y > containerSize.height + 20) {
            return null;
          }

          return (
            <TouchableOpacity
              key={airport.iata}
              style={{
                position: 'absolute',
                left: pos.x - markerSize / 2,
                top: pos.y - markerSize / 2,
                width: markerSize,
                height: markerSize,
                borderRadius: markerSize / 2,
                backgroundColor: markerColor,
                borderWidth: (isSelected || isOrigin || isDestination) ? 3 : 2,
                borderColor: isOrigin ? '#4ADE80' : isDestination ? '#FFB800' : '#FFFFFF',
                shadowColor: markerColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: (isSelected || isOrigin || isDestination) ? 8 : 4,
                elevation: 5,
                zIndex: (isSelected || isOrigin || isDestination) ? 100 : 10,
              }}
              onPress={() => handleAirportPress(airport)}
              activeOpacity={0.7}
            />
          );
        })}
      </View>

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
