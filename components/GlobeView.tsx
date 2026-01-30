import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { MapPin, AlertTriangle } from "lucide-react-native";
import { MAJOR_AIRPORTS, Airport } from "@/constants/airports";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GLOBE_SIZE = SCREEN_WIDTH * 0.85;
const GLOBE_RADIUS = GLOBE_SIZE / 2;

interface GlobeViewProps {
  onAirportSelect?: (airport: Airport) => void;
  userCountryCode?: string | null;
}

export default function GlobeView({ onAirportSelect, userCountryCode }: GlobeViewProps) {
  const [rotation, setRotation] = useState({ x: 20, y: -30 });
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isUserTouching, setIsUserTouching] = useState(false);
  
  const rotationRef = useRef(rotation);
  const velocityRef = useRef(velocity);
  const lastMoveTime = useRef(Date.now());
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);

  useEffect(() => {
    const animate = () => {
      if (!isUserTouching) {
        const currentVel = velocityRef.current;
        const friction = 0.95;
        const minVelocity = 0.05;
        
        const newVelX = Math.abs(currentVel.x) > minVelocity ? currentVel.x * friction : 0;
        const newVelY = Math.abs(currentVel.y) > minVelocity ? currentVel.y * friction : 0;
        
        if (newVelX !== 0 || newVelY !== 0) {
          setRotation(prev => ({
            x: Math.max(-70, Math.min(70, prev.x + newVelX)),
            y: prev.y + newVelY,
          }));
          setVelocity({ x: newVelX, y: newVelY });
        }
      }
      animationFrame.current = requestAnimationFrame(animate);
    };
    
    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isUserTouching]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsUserTouching(true);
        setVelocity({ x: 0, y: 0 });
        lastMoveTime.current = Date.now();
      },
      onPanResponderMove: (_, gestureState) => {
        const now = Date.now();
        const dt = Math.max(now - lastMoveTime.current, 1);
        lastMoveTime.current = now;
        
        const sensitivity = 0.4;
        const dx = gestureState.dx * sensitivity;
        const dy = gestureState.dy * sensitivity;
        
        setRotation(prev => ({
          x: Math.max(-70, Math.min(70, prev.x - gestureState.vy * 8)),
          y: prev.y + gestureState.vx * 8,
        }));
        
        setVelocity({
          x: -gestureState.vy * 3,
          y: gestureState.vx * 3,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsUserTouching(false);
        setVelocity({
          x: -gestureState.vy * 5,
          y: gestureState.vx * 5,
        });
      },
      onPanResponderTerminate: () => {
        setIsUserTouching(false);
      },
    })
  ).current;

  const projectToGlobe = useCallback(
    (lat: number, lon: number): { x: number; y: number; visible: boolean } => {
      const latRad = (lat * Math.PI) / 180;
      const lonRad = ((lon + rotation.y) * Math.PI) / 180;
      const rotXRad = (rotation.x * Math.PI) / 180;

      const x = Math.cos(latRad) * Math.sin(lonRad);
      const y = Math.sin(latRad);
      const z = Math.cos(latRad) * Math.cos(lonRad);

      const rotatedY = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const rotatedZ = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);

      return {
        x: GLOBE_RADIUS + x * GLOBE_RADIUS * 0.85,
        y: GLOBE_RADIUS - rotatedY * GLOBE_RADIUS * 0.85,
        visible: rotatedZ > 0,
      };
    },
    [rotation]
  );

  const handleAirportPress = useCallback(
    (airport: Airport) => {
      setSelectedAirport(airport);
      onAirportSelect?.(airport);
    },
    [onAirportSelect]
  );

  const getAirportColor = useCallback((airport: Airport): string => {
    if (!airport.operational) {
      return "#FF4444";
    }
    if (userCountryCode && airport.countryCode === userCountryCode) {
      return "#4ADE80";
    }
    return "#FF6B35";
  }, [userCountryCode]);

  const renderAirports = useCallback(() => {
    return MAJOR_AIRPORTS.map((airport) => {
      const pos = projectToGlobe(airport.latitude, airport.longitude);
      if (!pos.visible) return null;

      const isSelected = selectedAirport?.iata === airport.iata;
      const isClosed = !airport.operational;
      const isUserCountry = userCountryCode && airport.countryCode === userCountryCode;
      const dotSize = isSelected ? 12 : isClosed ? 8 : isUserCountry ? 8 : 6;
      const color = isSelected ? "#00D4FF" : getAirportColor(airport);

      return (
        <TouchableOpacity
          key={airport.iata}
          style={[
            styles.airportDot,
            {
              left: pos.x - dotSize / 2,
              top: pos.y - dotSize / 2,
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              shadowColor: color,
              borderWidth: isClosed ? 2 : 0,
              borderColor: isClosed ? "#FF4444" : "transparent",
              borderStyle: isClosed ? "dashed" : "solid",
            },
          ]}
          onPress={() => handleAirportPress(airport)}
          activeOpacity={0.7}
        >
          {isSelected && (
            <View style={styles.airportLabel}>
              <Text style={styles.airportLabelText}>{airport.iata}</Text>
              {isClosed && <AlertTriangle size={10} color="#FF4444" style={{ marginLeft: 2 }} />}
            </View>
          )}
        </TouchableOpacity>
      );
    });
  }, [projectToGlobe, selectedAirport, handleAirportPress, getAirportColor, userCountryCode]);

  const CONTINENT_OUTLINES = [
    { name: 'North America', points: [
      { lat: 70, lon: -170 }, { lat: 70, lon: -140 }, { lat: 70, lon: -100 }, { lat: 65, lon: -70 },
      { lat: 55, lon: -60 }, { lat: 45, lon: -65 }, { lat: 35, lon: -75 }, { lat: 30, lon: -85 },
      { lat: 25, lon: -80 }, { lat: 20, lon: -90 }, { lat: 15, lon: -90 }, { lat: 18, lon: -105 },
      { lat: 25, lon: -110 }, { lat: 32, lon: -117 }, { lat: 40, lon: -125 }, { lat: 50, lon: -125 },
      { lat: 60, lon: -140 }, { lat: 65, lon: -165 }, { lat: 70, lon: -170 }
    ]},
    { name: 'South America', points: [
      { lat: 12, lon: -70 }, { lat: 5, lon: -60 }, { lat: -5, lon: -35 }, { lat: -15, lon: -40 },
      { lat: -25, lon: -45 }, { lat: -35, lon: -55 }, { lat: -50, lon: -70 }, { lat: -55, lon: -70 },
      { lat: -50, lon: -75 }, { lat: -40, lon: -73 }, { lat: -30, lon: -72 }, { lat: -20, lon: -70 },
      { lat: -5, lon: -80 }, { lat: 5, lon: -77 }, { lat: 12, lon: -70 }
    ]},
    { name: 'Europe', points: [
      { lat: 70, lon: -10 }, { lat: 70, lon: 30 }, { lat: 60, lon: 30 }, { lat: 55, lon: 40 },
      { lat: 45, lon: 40 }, { lat: 40, lon: 30 }, { lat: 35, lon: 25 }, { lat: 38, lon: -10 },
      { lat: 45, lon: -10 }, { lat: 50, lon: 0 }, { lat: 55, lon: -5 }, { lat: 60, lon: -5 },
      { lat: 70, lon: -10 }
    ]},
    { name: 'Africa', points: [
      { lat: 35, lon: -10 }, { lat: 35, lon: 30 }, { lat: 30, lon: 35 }, { lat: 15, lon: 50 },
      { lat: 5, lon: 50 }, { lat: -10, lon: 40 }, { lat: -25, lon: 35 }, { lat: -35, lon: 25 },
      { lat: -35, lon: 18 }, { lat: -30, lon: 15 }, { lat: -15, lon: 12 }, { lat: 5, lon: 10 },
      { lat: 5, lon: -5 }, { lat: 15, lon: -17 }, { lat: 25, lon: -15 }, { lat: 35, lon: -10 }
    ]},
    { name: 'Asia', points: [
      { lat: 70, lon: 30 }, { lat: 75, lon: 100 }, { lat: 70, lon: 180 }, { lat: 65, lon: 170 },
      { lat: 55, lon: 165 }, { lat: 45, lon: 140 }, { lat: 35, lon: 140 }, { lat: 25, lon: 120 },
      { lat: 20, lon: 110 }, { lat: 5, lon: 105 }, { lat: -5, lon: 115 }, { lat: 5, lon: 100 },
      { lat: 20, lon: 90 }, { lat: 25, lon: 65 }, { lat: 30, lon: 50 }, { lat: 40, lon: 45 },
      { lat: 45, lon: 40 }, { lat: 55, lon: 40 }, { lat: 60, lon: 30 }, { lat: 70, lon: 30 }
    ]},
    { name: 'Australia', points: [
      { lat: -15, lon: 130 }, { lat: -10, lon: 145 }, { lat: -20, lon: 150 }, { lat: -30, lon: 155 },
      { lat: -38, lon: 148 }, { lat: -40, lon: 145 }, { lat: -35, lon: 135 }, { lat: -32, lon: 125 },
      { lat: -22, lon: 115 }, { lat: -15, lon: 125 }, { lat: -15, lon: 130 }
    ]}
  ];

  const renderContinents = useCallback(() => {
    const elements: React.ReactNode[] = [];
    
    CONTINENT_OUTLINES.forEach((continent, continentIdx) => {
      const projectedPoints = continent.points.map(p => projectToGlobe(p.lat, p.lon));
      
      for (let i = 0; i < projectedPoints.length - 1; i++) {
        if (projectedPoints[i].visible && projectedPoints[i + 1].visible) {
          const distance = Math.sqrt(
            Math.pow(projectedPoints[i + 1].x - projectedPoints[i].x, 2) +
            Math.pow(projectedPoints[i + 1].y - projectedPoints[i].y, 2)
          );
          
          if (distance < GLOBE_RADIUS) {
            elements.push(
              <View
                key={`continent-${continentIdx}-${i}`}
                style={[
                  styles.continentLine,
                  {
                    left: projectedPoints[i].x,
                    top: projectedPoints[i].y,
                    width: distance,
                    transform: [{
                      rotate: `${Math.atan2(
                        projectedPoints[i + 1].y - projectedPoints[i].y,
                        projectedPoints[i + 1].x - projectedPoints[i].x
                      )}rad`
                    }],
                  },
                ]}
              />
            );
          }
        }
      }
    });
    
    return elements;
  }, [projectToGlobe]);

  const renderGlobeGrid = useCallback(() => {
    const lines: React.ReactNode[] = [];

    for (let lat = -60; lat <= 60; lat += 30) {
      const points: { x: number; y: number; visible: boolean }[] = [];
      for (let lon = 0; lon <= 360; lon += 15) {
        points.push(projectToGlobe(lat, lon));
      }

      for (let i = 0; i < points.length - 1; i++) {
        if (points[i].visible && points[i + 1].visible) {
          lines.push(
            <View
              key={`lat-${lat}-${i}`}
              style={[
                styles.gridLine,
                {
                  left: points[i].x,
                  top: points[i].y,
                  width: Math.sqrt(
                    Math.pow(points[i + 1].x - points[i].x, 2) +
                      Math.pow(points[i + 1].y - points[i].y, 2)
                  ),
                  transform: [
                    {
                      rotate: `${Math.atan2(
                        points[i + 1].y - points[i].y,
                        points[i + 1].x - points[i].x
                      )}rad`,
                    },
                  ],
                },
              ]}
            />
          );
        }
      }
    }

    for (let lon = 0; lon < 360; lon += 30) {
      const points: { x: number; y: number; visible: boolean }[] = [];
      for (let lat = -90; lat <= 90; lat += 15) {
        points.push(projectToGlobe(lat, lon));
      }

      for (let i = 0; i < points.length - 1; i++) {
        if (points[i].visible && points[i + 1].visible) {
          lines.push(
            <View
              key={`lon-${lon}-${i}`}
              style={[
                styles.gridLine,
                {
                  left: points[i].x,
                  top: points[i].y,
                  width: Math.sqrt(
                    Math.pow(points[i + 1].x - points[i].x, 2) +
                      Math.pow(points[i + 1].y - points[i].y, 2)
                  ),
                  transform: [
                    {
                      rotate: `${Math.atan2(
                        points[i + 1].y - points[i].y,
                        points[i + 1].x - points[i].x
                      )}rad`,
                    },
                  ],
                },
              ]}
            />
          );
        }
      }
    }

    return lines;
  }, [projectToGlobe]);

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FF6B35" }]} />
          <Text style={styles.legendText}>Airports</Text>
        </View>
        {userCountryCode && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4ADE80" }]} />
            <Text style={styles.legendText}>Your country</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FF4444", borderWidth: 1, borderColor: "#FF4444" }]} />
          <Text style={styles.legendText}>Closed</Text>
        </View>
      </View>

      <View style={styles.globeWrapper} {...panResponder.panHandlers}>
        <View style={styles.globe}>
          <View style={styles.globeGradient} />
          {renderGlobeGrid()}
          {renderContinents()}
          {renderAirports()}
        </View>
      </View>
      
      {selectedAirport && (
        <View style={styles.selectedInfo}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedCity}>{selectedAirport.city}</Text>
            {!selectedAirport.operational && (
              <View style={styles.closedBadge}>
                <AlertTriangle size={12} color="#FF4444" />
                <Text style={styles.closedBadgeText}>CLOSED</Text>
              </View>
            )}
          </View>
          <Text style={styles.selectedName}>
            {selectedAirport.name} ({selectedAirport.iata})
          </Text>
          <Text style={styles.selectedCountry}>{selectedAirport.country}</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap",
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
    fontSize: 11,
  },
  globeWrapper: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
  },
  globe: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    borderRadius: GLOBE_SIZE / 2,
    backgroundColor: "#0A1628",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  globeGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: GLOBE_SIZE / 2,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.1)",
  },
  gridLine: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(0, 212, 255, 0.08)",
    transformOrigin: "left center",
  },
  continentLine: {
    position: "absolute",
    height: 2,
    backgroundColor: "rgba(76, 175, 80, 0.7)",
    transformOrigin: "left center",
  },
  airportDot: {
    position: "absolute",
    borderRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  airportLabel: {
    position: "absolute",
    top: -26,
    left: -14,
    backgroundColor: "rgba(0, 212, 255, 0.95)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  airportLabelText: {
    color: "#0A1628",
    fontSize: 10,
    fontWeight: "700" as const,
  },
  selectedInfo: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedCity: {
    color: "#00D4FF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  closedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  closedBadgeText: {
    color: "#FF4444",
    fontSize: 10,
    fontWeight: "700" as const,
  },
  selectedName: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  selectedCountry: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  closureReason: {
    color: "#FF4444",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
    fontStyle: "italic",
  },
});
