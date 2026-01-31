import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export const placesRouter = createTRPCRouter({
  searchNearby: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      type: z.string(),
      keyword: z.string().optional(),
      radius: z.number().default(2000),
    }))
    .query(async ({ input }) => {
      try {
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${input.latitude},${input.longitude}&radius=${input.radius}&type=${input.type}&key=${GOOGLE_PLACES_API_KEY}`;
        
        if (input.keyword) {
          url += `&keyword=${encodeURIComponent(input.keyword)}`;
        }

        console.log('Backend: Fetching places:', input.type, input.keyword);
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.error('Places API error:', data.status, data.error_message);
          return { results: [], status: data.status, error: data.error_message };
        }

        return { results: data.results || [], status: data.status };
      } catch (error) {
        console.error('Error fetching places:', error);
        return { results: [], status: 'ERROR', error: String(error) };
      }
    }),

  getAirportAmenities: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
    }))
    .query(async ({ input }) => {
      const { latitude, longitude } = input;
      const radius = 1500;

      const fetchPlaces = async (type: string, keyword?: string) => {
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;
        
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.error('Places API error:', data.status, data.error_message);
          return [];
        }

        return data.results || [];
      };

      try {
        const [foodResults, restroomResults, loungeResults, shopResults] = await Promise.all([
          fetchPlaces('restaurant', 'airport food restaurant cafe'),
          fetchPlaces('point_of_interest', 'restroom toilet bathroom airport'),
          fetchPlaces('point_of_interest', 'airport lounge vip'),
          fetchPlaces('store', 'airport shop duty free'),
        ]);

        const food = foodResults
          .filter((p: any) => p.rating && p.rating >= 3.5)
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 8);

        const restrooms = restroomResults.slice(0, 8);
        const lounges = loungeResults
          .filter((p: any) => p.rating && p.rating >= 4.0)
          .slice(0, 5);
        const shops = shopResults.slice(0, 8);

        return { food, restrooms, lounges, shops };
      } catch (error) {
        console.error('Error fetching airport amenities:', error);
        return { food: [], restrooms: [], lounges: [], shops: [] };
      }
    }),

  getPhotoUrl: publicProcedure
    .input(z.object({
      photoReference: z.string(),
      maxWidth: z.number().default(400),
    }))
    .query(({ input }) => {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${input.maxWidth}&photo_reference=${input.photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
    }),
});
