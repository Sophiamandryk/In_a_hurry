import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Search, 
  MapPin, 
  Plane, 
  X, 
  Star, 
  Utensils, 
  Bath, 
  ShoppingBag, 
  Armchair,
  ChevronRight,
  Clock
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { MAJOR_AIRPORTS, Airport } from "@/constants/airports";
import { getAirportAmenities, PlaceResult, getPhotoUrl, getPriceLevel } from "@/services/googlePlaces";

type AmenityTab = 'food' | 'restrooms' | 'lounges' | 'shops';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [activeTab, setActiveTab] = useState<AmenityTab>('food');

  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const { data: amenities, isLoading: amenitiesLoading } = useQuery({
    queryKey: ['airport-amenities', selectedAirport?.iata, selectedAirport?.latitude, selectedAirport?.longitude],
    queryFn: () => {
      if (!selectedAirport) return null;
      return getAirportAmenities(selectedAirport.latitude, selectedAirport.longitude);
    },
    enabled: !!selectedAirport,
    staleTime: 1000 * 60 * 10,
  });

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

  const handleAirportPress = useCallback((airport: Airport) => {
    setSelectedAirport(airport);
    setActiveTab('food');
  }, []);

  const closeModal = useCallback(() => {
    setSelectedAirport(null);
  }, []);

  const renderAirport = ({ item }: { item: Airport }) => (
    <TouchableOpacity 
      style={styles.airportCard} 
      activeOpacity={0.7}
      onPress={() => handleAirportPress(item)}
    >
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
      <ChevronRight size={20} color="#64748B" />
    </TouchableOpacity>
  );

  const renderPlaceItem = ({ item }: { item: PlaceResult }) => (
    <View style={styles.placeCard}>
      {item.photos && item.photos[0] ? (
        <Image 
          source={{ uri: getPhotoUrl(item.photos[0].photo_reference, 200) }}
          style={styles.placeImage}
        />
      ) : (
        <View style={[styles.placeImage, styles.placeholderImage]}>
          {activeTab === 'food' && <Utensils size={24} color="#64748B" />}
          {activeTab === 'restrooms' && <Bath size={24} color="#64748B" />}
          {activeTab === 'lounges' && <Armchair size={24} color="#64748B" />}
          {activeTab === 'shops' && <ShoppingBag size={24} color="#64748B" />}
        </View>
      )}
      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={2}>{item.name}</Text>
        {item.rating && (
          <View style={styles.ratingRow}>
            <Star size={14} color="#FFB800" fill="#FFB800" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            {item.user_ratings_total && (
              <Text style={styles.reviewCount}>({item.user_ratings_total})</Text>
            )}
            {item.price_level && (
              <Text style={styles.priceLevel}>{getPriceLevel(item.price_level)}</Text>
            )}
          </View>
        )}
        {item.vicinity && (
          <Text style={styles.placeVicinity} numberOfLines={1}>{item.vicinity}</Text>
        )}
        {item.opening_hours && (
          <View style={styles.openStatus}>
            <Clock size={12} color={item.opening_hours.open_now ? "#22C55E" : "#EF4444"} />
            <Text style={[
              styles.openStatusText,
              { color: item.opening_hours.open_now ? "#22C55E" : "#EF4444" }
            ]}>
              {item.opening_hours.open_now ? "Open now" : "Closed"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const getTabData = () => {
    if (!amenities) return [];
    switch (activeTab) {
      case 'food': return amenities.food;
      case 'restrooms': return amenities.restrooms;
      case 'lounges': return amenities.lounges;
      case 'shops': return amenities.shops;
      default: return [];
    }
  };

  const tabData = getTabData();

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

      <Modal
        visible={!!selectedAirport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalIata}>{selectedAirport?.iata}</Text>
              <Text style={styles.modalAirportName} numberOfLines={1}>
                {selectedAirport?.name}
              </Text>
              <View style={styles.modalLocationRow}>
                <MapPin size={14} color="#64748B" />
                <Text style={styles.modalLocationText}>
                  {selectedAirport?.city}, {selectedAirport?.country}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'food' && styles.tabActive]}
                onPress={() => setActiveTab('food')}
              >
                <Utensils size={16} color={activeTab === 'food' ? '#0A1628' : '#94A3B8'} />
                <Text style={[styles.tabText, activeTab === 'food' && styles.tabTextActive]}>
                  Food & Dining
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'restrooms' && styles.tabActive]}
                onPress={() => setActiveTab('restrooms')}
              >
                <Bath size={16} color={activeTab === 'restrooms' ? '#0A1628' : '#94A3B8'} />
                <Text style={[styles.tabText, activeTab === 'restrooms' && styles.tabTextActive]}>
                  Restrooms
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'lounges' && styles.tabActive]}
                onPress={() => setActiveTab('lounges')}
              >
                <Armchair size={16} color={activeTab === 'lounges' ? '#0A1628' : '#94A3B8'} />
                <Text style={[styles.tabText, activeTab === 'lounges' && styles.tabTextActive]}>
                  Lounges
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'shops' && styles.tabActive]}
                onPress={() => setActiveTab('shops')}
              >
                <ShoppingBag size={16} color={activeTab === 'shops' ? '#0A1628' : '#94A3B8'} />
                <Text style={[styles.tabText, activeTab === 'shops' && styles.tabTextActive]}>
                  Shops
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {amenitiesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00D4FF" />
              <Text style={styles.loadingText}>Finding places...</Text>
            </View>
          ) : tabData.length > 0 ? (
            <FlatList
              data={tabData}
              keyExtractor={(item) => item.place_id}
              renderItem={renderPlaceItem}
              contentContainerStyle={styles.placesList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyAmenities}>
              <Text style={styles.emptyAmenitiesText}>
                No {activeTab === 'food' ? 'restaurants' : activeTab} found nearby
              </Text>
              <Text style={styles.emptyAmenitiesSubtext}>
                Try checking other categories
              </Text>
            </View>
          )}
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: "#0A1628",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.1)",
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 16,
  },
  modalIata: {
    color: "#00D4FF",
    fontSize: 32,
    fontWeight: "800" as const,
    letterSpacing: 2,
  },
  modalAirportName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
    marginTop: 4,
  },
  modalLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  modalLocationText: {
    color: "#64748B",
    fontSize: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.1)",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    gap: 8,
  },
  tabActive: {
    backgroundColor: "#00D4FF",
  },
  tabText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  tabTextActive: {
    color: "#0A1628",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 15,
  },
  placesList: {
    padding: 16,
    gap: 12,
  },
  placeCard: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.1)",
    marginBottom: 12,
  },
  placeImage: {
    width: 100,
    height: 100,
  },
  placeholderImage: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  placeName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    color: "#FFB800",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  reviewCount: {
    color: "#64748B",
    fontSize: 12,
  },
  priceLevel: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "600" as const,
    marginLeft: 8,
  },
  placeVicinity: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  openStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  openStatusText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  emptyAmenities: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyAmenitiesText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600" as const,
    textAlign: "center",
  },
  emptyAmenitiesSubtext: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
