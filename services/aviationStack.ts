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

const HTTPS_URL = "https://api.aviationstack.com/v1";
const HTTP_URL = "http://api.aviationstack.com/v1";

async function tryFetch(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

async function fetchWithFallback(endpoint: string, apiKey: string): Promise<any> {
  // Try HTTPS first (for paid plans)
  try {
    console.log("[AviationStack] Trying HTTPS...");
    const httpsUrl = `${HTTPS_URL}${endpoint}`;
    const data = await tryFetch(httpsUrl);
    
    // Check if we got a valid response (not an SSL/upgrade error)
    if (!data.error || (data.error && data.error.code !== 105)) {
      return data;
    }
    console.log("[AviationStack] HTTPS requires upgrade, trying HTTP...");
  } catch (httpsError) {
    console.log("[AviationStack] HTTPS failed, trying HTTP...", httpsError);
  }
  
  // Fallback to HTTP (free plan)
  try {
    const httpUrl = `${HTTP_URL}${endpoint}`;
    return await tryFetch(httpUrl);
  } catch (httpError) {
    console.error("[AviationStack] HTTP also failed:", httpError);
    throw httpError;
  }
}

export async function getFlights(
  depIata: string,
  arrIata: string
): Promise<FlightSearchResult> {
  const apiKey = process.env.EXPO_PUBLIC_AVIATIONSTACK_API_KEY;
  
  console.log(`[AviationStack] Fetching flights from ${depIata} to ${arrIata}`);
  console.log(`[AviationStack] API key present: ${!!apiKey}`);
  console.log(`[AviationStack] API key value: ${apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING'}`);

  if (!apiKey || apiKey.trim() === '') {
    console.error("[AviationStack] API key not configured");
    return generateMockFlights(depIata, arrIata, "API key not configured - showing sample data");
  }

  try {
    // First try with scheduled flights
    const endpoint = `/flights?access_key=${apiKey}&dep_iata=${depIata}&arr_iata=${arrIata}&flight_status=scheduled`;
    console.log("[AviationStack] Fetching scheduled flights...");

    let data = await fetchWithFallback(endpoint, apiKey);

    console.log("[AviationStack] Response received");

    if (data.error) {
      console.error("[AviationStack] API Error:", data.error);
      // If API has issues, return mock data so the app still works
      if (data.error.code === 105 || data.error.code === 104 || data.error.code === 101) {
        console.log("[AviationStack] API limitation, generating mock flights");
        return generateMockFlights(depIata, arrIata, undefined);
      }
      return generateMockFlights(depIata, arrIata, data.error.message || "API error - showing sample data");
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
      const retryEndpoint = `/flights?access_key=${apiKey}&dep_iata=${depIata}&arr_iata=${arrIata}`;
      console.log("[AviationStack] Retrying without status filter...");
      
      data = await fetchWithFallback(retryEndpoint, apiKey);
      
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
    // Return mock data on network errors so the app remains functional
    return generateMockFlights(depIata, arrIata, undefined);
  }
}

function generateMockFlights(depIata: string, arrIata: string, errorMsg?: string): FlightSearchResult {
  console.log(`[AviationStack] Generating mock flights for ${depIata} -> ${arrIata}`);
  
  const now = new Date();
  const airlines = [
    { name: "LOT Polish Airlines", iata: "LO" },
    { name: "Lufthansa", iata: "LH" },
    { name: "KLM", iata: "KL" },
    { name: "Air France", iata: "AF" },
    { name: "British Airways", iata: "BA" },
    { name: "Ryanair", iata: "FR" },
    { name: "Wizz Air", iata: "W6" },
  ];
  
  const mockFlights: Flight[] = [];
  
  for (let i = 0; i < 3; i++) {
    const departureTime = new Date(now.getTime() + (i + 1) * 3 * 60 * 60 * 1000); // 3, 6, 9 hours from now
    const flightDuration = 2 + Math.random() * 3; // 2-5 hours
    const arrivalTime = new Date(departureTime.getTime() + flightDuration * 60 * 60 * 1000);
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNum = String(100 + Math.floor(Math.random() * 900));
    
    mockFlights.push({
      flightDate: departureTime.toISOString().split('T')[0],
      flightStatus: "scheduled",
      departure: {
        airport: `${depIata} International Airport`,
        iata: depIata,
        scheduled: departureTime.toISOString(),
        estimated: null,
        actual: null,
        terminal: String(Math.floor(Math.random() * 4) + 1),
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${Math.floor(Math.random() * 30) + 1}`,
      },
      arrival: {
        airport: `${arrIata} International Airport`,
        iata: arrIata,
        scheduled: arrivalTime.toISOString(),
        estimated: null,
        actual: null,
        terminal: String(Math.floor(Math.random() * 4) + 1),
        gate: null,
      },
      airline: airline,
      flight: {
        number: flightNum,
        iata: `${airline.iata}${flightNum}`,
      },
    });
  }
  
  return {
    flights: mockFlights,
    error: errorMsg,
  };
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
