import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Search, 
  MapPin, 
  Plane, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  MapPinned, 
  Star, 
  Clock, 
  DollarSign,
  ThumbsUp,
  Accessibility,
  Droplets,
  X,
  Wifi,
  AlertCircle
} from "lucide-react-native";
import { MAJOR_AIRPORTS, Airport } from "@/constants/airports";
import { getAirportAmenities, RestroomLocation } from "@/constants/airportAmenities";
import { fetchAirportData, FoodPlace, Review } from "@/services/googlePlaces";

interface AirportLiveData {
  food: FoodPlace[];
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [expandedAirport, setExpandedAirport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"food" | "restrooms" | "reviews">("food");
  const [liveData, setLiveData] = useState<Record<string, AirportLiveData>>({});

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

  const toggleExpanded = useCallback((iata: string) => {
    const isExpanding = expandedAirport !== iata;
    setExpandedAirport(prev => prev === iata ? null : iata);
    setActiveTab("food");

    if (isExpanding && !liveData[iata]) {
      setLiveData(prev => ({
        ...prev,
        [iata]: { food: [], reviews: [], isLoading: true, error: null }
      }));

      fetchAirportData(iata)
        .then(data => {
          console.log(`Received data for ${iata}:`, data.food.length, 'food places,', data.reviews.length, 'reviews');
          setLiveData(prev => ({
            ...prev,
            [iata]: {
              food: data.food,
              reviews: data.reviews,
              isLoading: false,
              error: null
            }
          }));
        })
        .catch(error => {
          console.error(`Error fetching data for ${iata}:`, error);
          setLiveData(prev => ({
            ...prev,
            [iata]: {
              food: [],
              reviews: [],
              isLoading: false,
              error: 'Failed to load live data'
            }
          }));
        });
    }
  }, [expandedAirport, liveData]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={12} 
          color={i < fullStars ? "#FFD700" : "#3A4A5C"} 
          fill={i < fullStars ? "#FFD700" : "transparent"} 
        />
      );
    }
    return stars;
  };

  const renderFoodPlace = (item: FoodPlace, index: number, isLive: boolean = false) => (
    <View key={index} style={styles.amenityItem}>
      <View style={styles.amenityHeader}>
        <View style={styles.nameWithBadge}>
          <Text style={styles.amenityName}>{item.name}</Text>
          {isLive && (
            <View style={styles.liveBadge}>
              <Wifi size={10} color="#10B981" />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.amenityType}>{item.type}</Text>
      <View style={styles.amenityDetails}>
        <View style={styles.detailRow}>
          <MapPin size={12} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>{item.terminal}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={12} color="#64748B" />
          <Text style={[styles.detailText, item.hours === "Open Now" && styles.openNow]}>
            {item.hours}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <DollarSign size={12} color="#64748B" />
          <Text style={styles.detailText}>{item.priceRange}</Text>
        </View>
      </View>
    </View>
  );

  const renderRestroom = (item: RestroomLocation, index: number) => (
    <View key={index} style={styles.amenityItem}>
      <Text style={styles.restroomLocation}>{item.location}</Text>
      <View style={styles.restroomFeatures}>
        {item.accessible && (
          <View style={styles.featureBadge}>
            <Accessibility size={12} color="#00D4FF" />
            <Text style={styles.featureText}>Accessible</Text>
          </View>
        )}
        {item.showers && (
          <View style={styles.featureBadge}>
            <Droplets size={12} color="#00D4FF" />
            <Text style={styles.featureText}>Showers</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderReview = (item: Review, index: number, isLive: boolean = false) => (
    <View key={index} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.author}</Text>
        <View style={styles.reviewRating}>
          {renderStars(item.rating)}
        </View>
        <Text style={styles.reviewDate}>{item.date}</Text>
        {isLive && (
          <View style={styles.liveBadgeSmall}>
            <Wifi size={8} color="#10B981" />
          </View>
        )}
      </View>
      <Text style={styles.reviewText} numberOfLines={4}>{item.text}</Text>
      <View style={styles.reviewHelpful}>
        <ThumbsUp size={12} color="#64748B" />
        <Text style={styles.helpfulText}>{item.helpful} found helpful</Text>
      </View>
    </View>
  );

  const renderAmenities = (iata: string) => {
    const airportLiveData = liveData[iata];
    const fallbackData = getAirportAmenities(iata);
    const isLoading = airportLiveData?.isLoading ?? false;
    const hasLiveFood = airportLiveData?.food && airportLiveData.food.length > 0;
    const hasLiveReviews = airportLiveData?.reviews && airportLiveData.reviews.length > 0;

    const foodToShow = hasLiveFood ? airportLiveData.food : fallbackData.food;
    const reviewsToShow = hasLiveReviews ? airportLiveData.reviews : fallbackData.reviews;

    return (
      <View style={styles.amenitiesContainer}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "food" && styles.activeTab]}
            onPress={() => setActiveTab("food")}
          >
            <Utensils size={14} color={activeTab === "food" ? "#00D4FF" : "#64748B"} />
            <Text style={[styles.tabText, activeTab === "food" && styles.activeTabText]}>Food</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "restrooms" && styles.activeTab]}
            onPress={() => setActiveTab("restrooms")}
          >
            <MapPinned size={14} color={activeTab === "restrooms" ? "#00D4FF" : "#64748B"} />
            <Text style={[styles.tabText, activeTab === "restrooms" && styles.activeTabText]}>Restrooms</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
            onPress={() => setActiveTab("reviews")}
          >
            <Star size={14} color={activeTab === "reviews" ? "#00D4FF" : "#64748B"} />
            <Text style={[styles.tabText, activeTab === "reviews" && styles.activeTabText]}>Reviews</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === "food" && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Rated Dining</Text>
                {hasLiveFood && (
                  <View style={styles.dataSourceBadge}>
                    <Star size={12} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.dataSourceTextGold}>4.0+ Stars</Text>
                  </View>
                )}
              </View>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#00D4FF" />
                  <Text style={styles.loadingText}>Fetching live data...</Text>
                </View>
              ) : (
                foodToShow.map((item, index) => renderFoodPlace(item, index, hasLiveFood))
              )}
            </View>
          )}
          {activeTab === "restrooms" && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Restroom Locations</Text>
                <View style={styles.dataSourceBadge}>
                  <AlertCircle size={12} color="#F59E0B" />
                  <Text style={styles.dataSourceTextFallback}>Airport Info</Text>
                </View>
              </View>
              {fallbackData.restrooms.map((item, index) => renderRestroom(item, index))}
            </View>
          )}
          {activeTab === "reviews" && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Best Reviews</Text>
                {hasLiveReviews && (
                  <View style={styles.dataSourceBadge}>
                    <Star size={12} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.dataSourceTextGold}>Top Rated</Text>
                  </View>
                )}
              </View>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#00D4FF" />
                  <Text style={styles.loadingText}>Fetching reviews...</Text>
                </View>
              ) : (
                reviewsToShow.map((item, index) => renderReview(item, index, hasLiveReviews))
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderAirport = ({ item }: { item: Airport }) => {
    const isExpanded = expandedAirport === item.iata;

    return (
      <View style={styles.airportCardWrapper}>
        <TouchableOpacity 
          style={[styles.airportCard, isExpanded && styles.airportCardExpanded]} 
          activeOpacity={0.7}
          onPress={() => toggleExpanded(item.iata)}
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
          <View style={styles.expandIcon}>
            {isExpanded ? (
              <ChevronUp size={20} color="#00D4FF" />
            ) : (
              <ChevronDown size={20} color="#64748B" />
            )}
          </View>
        </TouchableOpacity>
        
        {isExpanded && renderAmenities(item.iata)}
      </View>
    );
  };

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
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countryListContainer}>
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
      </View>

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
  countryListContainer: {
    minHeight: 60,
  },
  countryList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  countryChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#1E3A5F",
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "#00D4FF",
  },
  countryChipSelected: {
    backgroundColor: "#00D4FF",
    borderColor: "#00D4FF",
  },
  countryChipText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700" as const,
  },
  countryChipTextSelected: {
    color: "#0A1628",
    fontWeight: "700" as const,
  },
  airportList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  airportCardWrapper: {
    marginBottom: 12,
  },
  airportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.1)",
    gap: 12,
  },
  airportCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
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
  expandIcon: {
    padding: 4,
  },
  amenitiesContainer: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(0, 212, 255, 0.1)",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.1)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#00D4FF",
  },
  tabText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  activeTabText: {
    color: "#00D4FF",
  },
  tabContent: {
    padding: 14,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  amenityItem: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.08)",
  },
  amenityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  amenityName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600" as const,
    marginLeft: 4,
  },
  amenityType: {
    color: "#00D4FF",
    fontSize: 12,
    marginBottom: 8,
  },
  amenityDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    color: "#94A3B8",
    fontSize: 11,
    flex: 1,
  },
  openNow: {
    color: "#10B981",
    fontWeight: "600" as const,
  },
  nameWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  liveBadgeSmall: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    padding: 4,
    borderRadius: 6,
    marginLeft: "auto",
  },
  liveText: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "600" as const,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dataSourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dataSourceText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "600" as const,
  },
  dataSourceTextFallback: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "600" as const,
  },
  dataSourceTextGold: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "600" as const,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 10,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 13,
  },
  restroomLocation: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  restroomFeatures: {
    flexDirection: "row",
    gap: 10,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 212, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  featureText: {
    color: "#00D4FF",
    fontSize: 11,
    fontWeight: "500" as const,
  },
  reviewItem: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.08)",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  reviewAuthor: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    color: "#64748B",
    fontSize: 11,
    marginLeft: "auto",
  },
  reviewText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  reviewHelpful: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  helpfulText: {
    color: "#64748B",
    fontSize: 11,
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
