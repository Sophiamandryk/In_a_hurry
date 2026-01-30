export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  operational: boolean;
  closureReason?: string;
}

export const CLOSED_AIRPORTS_INFO: Record<string, string> = {
  KBP: "Closed since February 2022 due to the ongoing war in Ukraine. Ukrainian airspace remains closed to civilian traffic.",
  IEV: "Kyiv Zhuliany - Closed since February 2022 due to the ongoing war in Ukraine.",
  ODS: "Odesa International - Closed since February 2022 due to the ongoing war in Ukraine.",
  HRK: "Kharkiv International - Closed since February 2022 due to the ongoing war in Ukraine.",
  DNK: "Dnipro International - Closed since February 2022 due to the ongoing war in Ukraine.",
  LWO: "Lviv Danylo Halytskyi - Closed since February 2022 due to the ongoing war in Ukraine.",
};

export const MAJOR_AIRPORTS: Airport[] = [
  { iata: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", countryCode: "US", latitude: 40.6413, longitude: -73.7781, operational: true },
  { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "United States", countryCode: "US", latitude: 33.9425, longitude: -118.4081, operational: true },
  { iata: "ORD", name: "O'Hare International", city: "Chicago", country: "United States", countryCode: "US", latitude: 41.9742, longitude: -87.9073, operational: true },
  { iata: "LHR", name: "Heathrow", city: "London", country: "United Kingdom", countryCode: "GB", latitude: 51.4700, longitude: -0.4543, operational: true },
  { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", countryCode: "FR", latitude: 49.0097, longitude: 2.5479, operational: true },
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", countryCode: "DE", latitude: 50.0379, longitude: 8.5622, operational: true },
  { iata: "AMS", name: "Schiphol", city: "Amsterdam", country: "Netherlands", countryCode: "NL", latitude: 52.3105, longitude: 4.7683, operational: true },
  { iata: "DXB", name: "Dubai International", city: "Dubai", country: "UAE", countryCode: "AE", latitude: 25.2532, longitude: 55.3657, operational: true },
  { iata: "SIN", name: "Changi", city: "Singapore", country: "Singapore", countryCode: "SG", latitude: 1.3644, longitude: 103.9915, operational: true },
  { iata: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "China", countryCode: "HK", latitude: 22.3080, longitude: 113.9185, operational: true },
  { iata: "NRT", name: "Narita International", city: "Tokyo", country: "Japan", countryCode: "JP", latitude: 35.7720, longitude: 140.3929, operational: true },
  { iata: "HND", name: "Haneda", city: "Tokyo", country: "Japan", countryCode: "JP", latitude: 35.5494, longitude: 139.7798, operational: true },
  { iata: "ICN", name: "Incheon International", city: "Seoul", country: "South Korea", countryCode: "KR", latitude: 37.4602, longitude: 126.4407, operational: true },
  { iata: "PEK", name: "Beijing Capital", city: "Beijing", country: "China", countryCode: "CN", latitude: 40.0799, longitude: 116.6031, operational: true },
  { iata: "PVG", name: "Pudong International", city: "Shanghai", country: "China", countryCode: "CN", latitude: 31.1443, longitude: 121.8083, operational: true },
  { iata: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia", countryCode: "AU", latitude: -33.9399, longitude: 151.1753, operational: true },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", countryCode: "AU", latitude: -37.6690, longitude: 144.8410, operational: true },
  { iata: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "Poland", countryCode: "PL", latitude: 52.1657, longitude: 20.9671, operational: true },
  { iata: "KBP", name: "Boryspil International", city: "Kyiv", country: "Ukraine", countryCode: "UA", latitude: 50.3450, longitude: 30.8947, operational: false, closureReason: "Closed since February 2022 due to the ongoing war" },
  { iata: "IEV", name: "Kyiv Zhuliany", city: "Kyiv", country: "Ukraine", countryCode: "UA", latitude: 50.4019, longitude: 30.4519, operational: false, closureReason: "Closed since February 2022 due to the ongoing war" },
  { iata: "LWO", name: "Lviv Danylo Halytskyi", city: "Lviv", country: "Ukraine", countryCode: "UA", latitude: 49.8125, longitude: 23.9561, operational: false, closureReason: "Closed since February 2022 due to the ongoing war" },
  { iata: "ODS", name: "Odesa International", city: "Odesa", country: "Ukraine", countryCode: "UA", latitude: 46.4268, longitude: 30.6765, operational: false, closureReason: "Closed since February 2022 due to the ongoing war" },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", countryCode: "TR", latitude: 41.2753, longitude: 28.7519, operational: true },
  { iata: "DOH", name: "Hamad International", city: "Doha", country: "Qatar", countryCode: "QA", latitude: 25.2731, longitude: 51.6081, operational: true },
  { iata: "GRU", name: "Guarulhos International", city: "São Paulo", country: "Brazil", countryCode: "BR", latitude: -23.4356, longitude: -46.4731, operational: true },
  { iata: "EZE", name: "Ministro Pistarini", city: "Buenos Aires", country: "Argentina", countryCode: "AR", latitude: -34.8222, longitude: -58.5358, operational: true },
  { iata: "MEX", name: "Mexico City International", city: "Mexico City", country: "Mexico", countryCode: "MX", latitude: 19.4363, longitude: -99.0721, operational: true },
  { iata: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada", countryCode: "CA", latitude: 43.6777, longitude: -79.6248, operational: true },
  { iata: "YVR", name: "Vancouver International", city: "Vancouver", country: "Canada", countryCode: "CA", latitude: 49.1967, longitude: -123.1815, operational: true },
  { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", countryCode: "DE", latitude: 48.3537, longitude: 11.7750, operational: true },
  { iata: "FCO", name: "Leonardo da Vinci–Fiumicino", city: "Rome", country: "Italy", countryCode: "IT", latitude: 41.8003, longitude: 12.2389, operational: true },
  { iata: "MAD", name: "Adolfo Suárez Madrid–Barajas", city: "Madrid", country: "Spain", countryCode: "ES", latitude: 40.4983, longitude: -3.5676, operational: true },
  { iata: "BCN", name: "Barcelona–El Prat", city: "Barcelona", country: "Spain", countryCode: "ES", latitude: 41.2974, longitude: 2.0833, operational: true },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", countryCode: "CH", latitude: 47.4647, longitude: 8.5492, operational: true },
  { iata: "VIE", name: "Vienna International", city: "Vienna", country: "Austria", countryCode: "AT", latitude: 48.1103, longitude: 16.5697, operational: true },
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", countryCode: "DK", latitude: 55.6180, longitude: 12.6508, operational: true },
  { iata: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden", countryCode: "SE", latitude: 59.6519, longitude: 17.9186, operational: true },
  { iata: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Norway", countryCode: "NO", latitude: 60.1939, longitude: 11.1004, operational: true },
  { iata: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", country: "Finland", countryCode: "FI", latitude: 60.3172, longitude: 24.9633, operational: true },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", countryCode: "IE", latitude: 53.4264, longitude: -6.2499, operational: true },
  { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", countryCode: "BE", latitude: 50.9014, longitude: 4.4844, operational: true },
  { iata: "LIS", name: "Lisbon Airport", city: "Lisbon", country: "Portugal", countryCode: "PT", latitude: 38.7756, longitude: -9.1354, operational: true },
  { iata: "ATH", name: "Athens International", city: "Athens", country: "Greece", countryCode: "GR", latitude: 37.9364, longitude: 23.9445, operational: true },
  { iata: "PRG", name: "Václav Havel Airport", city: "Prague", country: "Czech Republic", countryCode: "CZ", latitude: 50.1008, longitude: 14.2600, operational: true },
  { iata: "BUD", name: "Budapest Ferenc Liszt", city: "Budapest", country: "Hungary", countryCode: "HU", latitude: 47.4298, longitude: 19.2611, operational: true },
  { iata: "DEL", name: "Indira Gandhi International", city: "New Delhi", country: "India", countryCode: "IN", latitude: 28.5562, longitude: 77.1000, operational: true },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", country: "India", countryCode: "IN", latitude: 19.0896, longitude: 72.8656, operational: true },
  { iata: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thailand", countryCode: "TH", latitude: 13.6900, longitude: 100.7501, operational: true },
  { iata: "KUL", name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", latitude: 2.7456, longitude: 101.7099, operational: true },
  { iata: "CGK", name: "Soekarno-Hatta", city: "Jakarta", country: "Indonesia", countryCode: "ID", latitude: -6.1256, longitude: 106.6559, operational: true },
  { iata: "MNL", name: "Ninoy Aquino International", city: "Manila", country: "Philippines", countryCode: "PH", latitude: 14.5086, longitude: 121.0194, operational: true },
  { iata: "JNB", name: "O.R. Tambo International", city: "Johannesburg", country: "South Africa", countryCode: "ZA", latitude: -26.1392, longitude: 28.2460, operational: true },
  { iata: "CAI", name: "Cairo International", city: "Cairo", country: "Egypt", countryCode: "EG", latitude: 30.1219, longitude: 31.4056, operational: true },
];

export function findAirportByIata(iata: string): Airport | undefined {
  return MAJOR_AIRPORTS.find(a => a.iata.toUpperCase() === iata.toUpperCase());
}

export function findAirportsByCity(city: string): Airport[] {
  return MAJOR_AIRPORTS.filter(a => 
    a.city.toLowerCase().includes(city.toLowerCase())
  );
}

export function findAirportsByCountry(country: string): Airport[] {
  return MAJOR_AIRPORTS.filter(a => 
    a.country.toLowerCase().includes(country.toLowerCase())
  );
}
