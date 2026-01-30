import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Modal, Pressable } from "react-native";
import { Plane, Clock, MapPin, Ticket, X, ExternalLink } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import { Flight, formatFlightTime, formatFlightDate } from "@/services/aviationStack";

interface FlightCardProps {
  flight: Flight;
}

interface BookingOption {
  name: string;
  icon: string;
  color: string;
  getUrl: (params: BookingParams) => string;
}

interface BookingParams {
  departureCode: string;
  arrivalCode: string;
  departureDate: string;
  flightNumber: string;
  airlineName: string;
}

const BOOKING_OPTIONS: BookingOption[] = [
  {
    name: 'Kiwi.com',
    icon: '🥝',
    color: '#00A991',
    getUrl: ({ departureCode, arrivalCode, departureDate }) => {
      const formattedDate = departureDate.replace(/-/g, '-');
      return `https://www.kiwi.com/en/search/results/${departureCode}/${arrivalCode}/${formattedDate}`;
    },
  },
  {
    name: 'Skyscanner',
    icon: '🔍',
    color: '#0770E3',
    getUrl: ({ departureCode, arrivalCode, departureDate }) => {
      const formattedDate = departureDate.replace(/-/g, '');
      return `https://www.skyscanner.com/transport/flights/${departureCode.toLowerCase()}/${arrivalCode.toLowerCase()}/${formattedDate.slice(2)}/`;
    },
  },
  {
    name: 'Google Flights',
    icon: '✈️',
    color: '#4285F4',
    getUrl: ({ departureCode, arrivalCode, departureDate }) => {
      return `https://www.google.com/travel/flights?q=flights%20from%20${departureCode}%20to%20${arrivalCode}%20on%20${departureDate}`;
    },
  },
  {
    name: 'Kayak',
    icon: '🛩️',
    color: '#FF690F',
    getUrl: ({ departureCode, arrivalCode, departureDate }) => {
      return `https://www.kayak.com/flights/${departureCode}-${arrivalCode}/${departureDate}`;
    },
  },
  {
    name: 'Momondo',
    icon: '🌍',
    color: '#FF6B00',
    getUrl: ({ departureCode, arrivalCode, departureDate }) => {
      return `https://www.momondo.com/flight-search/${departureCode}-${arrivalCode}/${departureDate}`;
    },
  },
];

export default function FlightCard({ flight }: FlightCardProps) {
  const [showBookingOptions, setShowBookingOptions] = useState(false);

  const getBookingParams = (): BookingParams => {
    return {
      flightNumber: flight.flight.iata || '',
      airlineName: flight.airline.name || '',
      departureCode: flight.departure.iata || '',
      arrivalCode: flight.arrival.iata || '',
      departureDate: flight.departure.scheduled 
        ? new Date(flight.departure.scheduled).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
    };
  };

  const handleOpenBookingSite = async (option: BookingOption) => {
    const params = getBookingParams();
    const url = option.getUrl(params);
    
    console.log(`[FlightCard] Opening ${option.name}:`, url);
    
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (error) {
      console.log('Error opening browser:', error);
      Linking.openURL(url);
    }
    
    setShowBookingOptions(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "#00D4FF";
      case "active":
        return "#4ADE80";
      case "landed":
        return "#A78BFA";
      case "cancelled":
        return "#F87171";
      case "delayed":
        return "#FBBF24";
      default:
        return "#94A3B8";
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.airlineInfo}>
          <Plane size={16} color="#00D4FF" />
          <Text style={styles.flightNumber}>{flight.flight.iata}</Text>
          <Text style={styles.airlineName}>{flight.airline.name}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(flight.flightStatus) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(flight.flightStatus) }]}
          >
            {flight.flightStatus}
          </Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.airport}>
          <Text style={styles.iataCode}>{flight.departure.iata}</Text>
          <Text style={styles.airportName} numberOfLines={1}>
            {flight.departure.airport}
          </Text>
          <View style={styles.timeContainer}>
            <Clock size={12} color="#94A3B8" />
            <Text style={styles.time}>
              {formatFlightTime(flight.departure.scheduled)}
            </Text>
          </View>
        </View>

        <View style={styles.routeLine}>
          <View style={styles.line} />
          <Plane size={18} color="#00D4FF" style={styles.planeIcon} />
          <View style={styles.line} />
        </View>

        <View style={[styles.airport, styles.arrivalAirport]}>
          <Text style={styles.iataCode}>{flight.arrival.iata}</Text>
          <Text style={styles.airportName} numberOfLines={1}>
            {flight.arrival.airport}
          </Text>
          <View style={styles.timeContainer}>
            <Clock size={12} color="#94A3B8" />
            <Text style={styles.time}>
              {formatFlightTime(flight.arrival.scheduled)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <MapPin size={12} color="#64748B" />
          <Text style={styles.dateText}>
            {formatFlightDate(flight.departure.scheduled)}
          </Text>
        </View>
        {flight.departure.terminal && (
          <Text style={styles.terminalText}>
            Terminal {flight.departure.terminal}
            {flight.departure.gate && ` • Gate ${flight.departure.gate}`}
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.bookButton} 
        onPress={() => setShowBookingOptions(true)}
        activeOpacity={0.8}
      >
        <Ticket size={16} color="#FFFFFF" />
        <Text style={styles.bookButtonText}>Book Ticket</Text>
      </TouchableOpacity>

      <Modal
        visible={showBookingOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBookingOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowBookingOptions(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book this flight</Text>
              <TouchableOpacity 
                onPress={() => setShowBookingOptions(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.flightSummary}>
              <Text style={styles.flightSummaryText}>
                {flight.departure.iata} → {flight.arrival.iata}
              </Text>
              <Text style={styles.flightSummaryDate}>
                {formatFlightDate(flight.departure.scheduled)} • {flight.flight.iata}
              </Text>
            </View>

            <Text style={styles.selectSiteText}>Select booking site:</Text>

            <View style={styles.bookingOptions}>
              {BOOKING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.name}
                  style={[styles.bookingOption, { borderColor: option.color + '40' }]}
                  onPress={() => handleOpenBookingSite(option)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bookingOptionIcon}>{option.icon}</Text>
                  <Text style={styles.bookingOptionName}>{option.name}</Text>
                  <ExternalLink size={14} color="#64748B" />
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  airlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  flightNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  airlineName: {
    color: "#94A3B8",
    fontSize: 12,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  airport: {
    flex: 1,
  },
  arrivalAirport: {
    alignItems: "flex-end",
  },
  iataCode: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  airportName: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
    maxWidth: 100,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  time: {
    color: "#00D4FF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  routeLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0, 212, 255, 0.3)",
  },
  planeIcon: {
    marginHorizontal: 4,
    transform: [{ rotate: "90deg" }],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    color: "#64748B",
    fontSize: 12,
  },
  terminalText: {
    color: "#64748B",
    fontSize: 12,
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00D4FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  closeButton: {
    padding: 4,
  },
  flightSummary: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  flightSummaryText: {
    color: '#00D4FF',
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  flightSummaryDate: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  selectSiteText: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 12,
  },
  bookingOptions: {
    gap: 10,
  },
  bookingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  bookingOptionIcon: {
    fontSize: 20,
  },
  bookingOptionName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
});
