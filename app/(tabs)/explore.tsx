import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MapPin, Plane } from "lucide-react-native";
import { MAJOR_AIRPORTS, Airport } from "@/constants/airports";

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(MAJOR_AIRPORTS.map((a) => a.country))];
    return uniqueCountries.sort();
  }, []);

  const filteredAirports = useMemo(() => {
    let airports = MAJOR_AIRPORTS;

    if (selectedCountry) {
      airports = airports.filter((a) => a.country === selectedCountry);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      airports = airports.filter(
        (a) =>
          a.iata.toLowerCase().includes(query) ||
          a.name.toLowerCase().includes(query) ||
          a.city.toLowerCase().includes(query) ||
          a.country.toLowerCase().includes(query)
      );
    }

    return airports;
  }, [searchQuery, selectedCountry]);

  const renderAirport = ({ item }: { item: Airport }) => (
    <TouchableOpacity style={styles.airportCard} activeOpacity={0.7}>
      <View style={styles.airportIcon}>
        <Plane size={20} color="#00D4FF" />
      </View>
      <View style={styles.airportInfo}>
        <View style={styles.airportHeader}>
          <Text style={styles.iataCode}>{item.iata}</Text>
          <Text style={styles.cityName}>{item.city}</Text>
        </View>
        <Text style={styles.airportName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.locationRow}>
          <MapPin size={12} color="#64748B" />
          <Text style={styles.countryText}>{item.country}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Airports</Text>
        <Text style={styles.subtitle}>
          {MAJOR_AIRPORTS.length} airports worldwide
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search airports, cities, countries..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={countries}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.countryList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.countryChip,
              selectedCountry === item && styles.countryChipSelected,
            ]}
            onPress={() =>
              setSelectedCountry(selectedCountry === item ? null : item)
            }
          >
            <Text
              style={[
                styles.countryChipText,
                selectedCountry === item && styles.countryChipTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredAirports}
        keyExtractor={(item) => item.iata}
        renderItem={renderAirport}
        contentContainerStyle={styles.airportList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No airports found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050D1A",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: "#FFFFFF",
    fontSize: 15,
  },
  countryList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  countryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.1)",
  },
  countryChipSelected: {
    backgroundColor: "#00D4FF",
    borderColor: "#00D4FF",
  },
  countryChipText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500" as const,
  },
  countryChipTextSelected: {
    color: "#0A1628",
  },
  airportList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  airportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.1)",
    gap: 12,
  },
  airportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0, 212, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  airportInfo: {
    flex: 1,
  },
  airportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iataCode: {
    color: "#00D4FF",
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  cityName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  airportName: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  countryText: {
    color: "#64748B",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 15,
  },
});
