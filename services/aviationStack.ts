export interface Flight {
  flightDate: string;
  flightStatus: string;
  departure: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated: string | null;
    actual: string | null;
    terminal: string | null;
    gate: string | null;
  };
  arrival: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated: string | null;
    actual: string | null;
    terminal: string | null;
    gate: string | null;
  };
  airline: {
    name: string;
    iata: string;
  };
  flight: {
    number: string;
    iata: string;
  };
}

export interface FlightSearchResult {
  flights: Flight[];
  error?: string;
  nextAvailableFlight?: Flight;
}

const AVIATIONSTACK_API_KEY = process.env.EXPO_PUBLIC_AVIATIONSTACK_API_KEY;
const BASE_URL = "http://api.aviationstack.com/v1";

export async function getFlights(
  depIata: string,
  arrIata: string
): Promise<FlightSearchResult> {
  console.log(`[AviationStack] Fetching flights from ${depIata} to ${arrIata}`);

  if (!AVIATIONSTACK_API_KEY) {
    console.error("[AviationStack] API key not configured");
    return {
      flights: [],
      error: "AviationStack API key not configured. Please set EXPO_PUBLIC_AVIATIONSTACK_API_KEY in your environment.",
    };
  }

  try {
    // First try with scheduled flights
    let url = `${BASE_URL}/flights?access_key=${AVIATIONSTACK_API_KEY}&dep_iata=${depIata}&arr_iata=${arrIata}&flight_status=scheduled`;
    console.log("[AviationStack] Request URL:", url.replace(AVIATIONSTACK_API_KEY, "***"));

    let response = await fetch(url);
    let data = await response.json();

    console.log("[AviationStack] Response status:", response.status);

    if (data.error) {
      console.error("[AviationStack] API Error:", data.error);
      return {
        flights: [],
        error: data.error.message || "Failed to fetch flight data",
      };
    }

    const now = new Date();
    console.log(`[AviationStack] Current local time: ${now.toISOString()}, Local: ${now.toLocaleString()}`);

    const mapFlightData = (f: any): Flight => ({
      flightDate: f.flight_date,
      flightStatus: f.flight_status,
      departure: {
        airport: f.departure?.airport || "Unknown",
        iata: f.departure?.iata || depIata,
        scheduled: f.departure?.scheduled || "",
        estimated: f.departure?.estimated,
        actual: f.departure?.actual,
        terminal: f.departure?.terminal,
        gate: f.departure?.gate,
      },
      arrival: {
        airport: f.arrival?.airport || "Unknown",
        iata: f.arrival?.iata || arrIata,
        scheduled: f.arrival?.scheduled || "",
        estimated: f.arrival?.estimated,
        actual: f.arrival?.actual,
        terminal: f.arrival?.terminal,
        gate: f.arrival?.gate,
      },
      airline: {
        name: f.airline?.name || "Unknown Airline",
        iata: f.airline?.iata || "",
      },
      flight: {
        number: f.flight?.number || "",
        iata: f.flight?.iata || "",
      },
    });

    let allFlights: Flight[] = (data.data || []).map(mapFlightData);

    // Filter upcoming flights
    let flights = allFlights.filter((flight) => {
      const departureTime = new Date(flight.departure.scheduled);
      const isUpcoming = departureTime > now;
      if (!isUpcoming) {
        console.log(`[AviationStack] Filtering out past flight ${flight.flight.iata} departing at ${flight.departure.scheduled}`);
      }
      return isUpcoming;
    });

    flights.sort((a, b) => {
      const timeA = new Date(a.departure.scheduled).getTime();
      const timeB = new Date(b.departure.scheduled).getTime();
      return timeA - timeB;
    });

    console.log(`[AviationStack] Found ${allFlights.length} total flights, ${flights.length} upcoming`);

    // If no upcoming scheduled flights, try fetching all flights (including active) to find the closest one
    if (flights.length === 0) {
      console.log("[AviationStack] No scheduled flights found, searching for any available flights...");
      
      // Try without flight_status filter to get all flights
      url = `${BASE_URL}/flights?access_key=${AVIATIONSTACK_API_KEY}&dep_iata=${depIata}&arr_iata=${arrIata}`;
      console.log("[AviationStack] Retry URL:", url.replace(AVIATIONSTACK_API_KEY, "***"));
      
      response = await fetch(url);
      data = await response.json();
      
      if (!data.error && data.data) {
        allFlights = (data.data || []).map(mapFlightData);
        
        // Sort all flights by departure time
        allFlights.sort((a, b) => {
          const timeA = new Date(a.departure.scheduled).getTime();
          const timeB = new Date(b.departure.scheduled).getTime();
          return timeA - timeB;
        });
        
        // Find the closest upcoming flight (even if it's later today or tomorrow)
        const closestUpcoming = allFlights.find((flight) => {
          const departureTime = new Date(flight.departure.scheduled);
          return departureTime > now;
        });
        
        if (closestUpcoming) {
          console.log(`[AviationStack] Found closest upcoming flight: ${closestUpcoming.flight.iata} at ${closestUpcoming.departure.scheduled}`);
          return { flights: [], nextAvailableFlight: closestUpcoming };
        }
        
        // If still no upcoming, return the latest flight as reference (might be next day's schedule)
        const latestFlight = allFlights[allFlights.length - 1];
        if (latestFlight) {
          console.log(`[AviationStack] Returning latest available flight info: ${latestFlight.flight.iata}`);
          return { flights: [], nextAvailableFlight: latestFlight };
        }
      }
    }

    return { flights };
  } catch (error) {
    console.error("[AviationStack] Fetch error:", error);
    return {
      flights: [],
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

export function formatFlightTime(isoString: string, userTimezone?: string): string {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    return date.toLocaleTimeString("en-US", options);
  } catch {
    return isoString;
  }
}

export function formatFlightDate(isoString: string, userTimezone?: string): string {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    return date.toLocaleDateString("en-US", options);
  } catch {
    return isoString;
  }
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
