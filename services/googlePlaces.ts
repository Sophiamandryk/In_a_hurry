const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export interface PlaceResult {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
  price_level?: number;
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
}

export interface PlacesResponse {
  results: PlaceResult[];
  status: string;
  error_message?: string;
}

export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  type: string,
  keyword?: string,
  radius: number = 2000
): Promise<PlaceResult[]> {
  try {
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;
    
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }

    console.log('Fetching places:', type, keyword);
    
    const response = await fetch(url);
    const data: PlacesResponse = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message);
      return [];
    }

    return data.results || [];
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}

export async function getAirportFood(
  latitude: number,
  longitude: number
): Promise<PlaceResult[]> {
  const results = await searchNearbyPlaces(
    latitude,
    longitude,
    'restaurant',
    'airport food restaurant cafe',
    1500
  );
  
  return results
    .filter(place => place.rating && place.rating >= 3.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);
}

export async function getAirportRestrooms(
  latitude: number,
  longitude: number
): Promise<PlaceResult[]> {
  const results = await searchNearbyPlaces(
    latitude,
    longitude,
    'point_of_interest',
    'restroom toilet bathroom airport',
    1500
  );
  
  return results.slice(0, 10);
}

export async function getAirportAmenities(
  latitude: number,
  longitude: number
): Promise<{
  food: PlaceResult[];
  restrooms: PlaceResult[];
  lounges: PlaceResult[];
  shops: PlaceResult[];
}> {
  const [food, restrooms, lounges, shops] = await Promise.all([
    getAirportFood(latitude, longitude),
    getAirportRestrooms(latitude, longitude),
    searchNearbyPlaces(latitude, longitude, 'point_of_interest', 'airport lounge vip', 1500),
    searchNearbyPlaces(latitude, longitude, 'store', 'airport shop duty free', 1500),
  ]);

  return {
    food: food.slice(0, 8),
    restrooms: restrooms.slice(0, 8),
    lounges: lounges.filter(p => p.rating && p.rating >= 4.0).slice(0, 5),
    shops: shops.slice(0, 8),
  };
}

export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

export function getPriceLevel(level?: number): string {
  if (!level) return '';
  return '$'.repeat(level);
}

export function formatRating(rating?: number): string {
  if (!rating) return 'N/A';
  return rating.toFixed(1);
}
