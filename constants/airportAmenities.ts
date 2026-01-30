export interface FoodPlace {
  name: string;
  type: string;
  terminal: string;
  rating: number;
  priceRange: string;
  hours: string;
}

export interface RestroomLocation {
  location: string;
  accessible: boolean;
  showers: boolean;
}

export interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
}

export interface AirportAmenities {
  food: FoodPlace[];
  restrooms: RestroomLocation[];
  reviews: Review[];
}

export const AIRPORT_AMENITIES: Record<string, AirportAmenities> = {
  JFK: {
    food: [
      { name: "Shake Shack", type: "Burgers", terminal: "Terminal 4", rating: 4.3, priceRange: "$$", hours: "5:00 AM - 11:00 PM" },
      { name: "Blue Ribbon Sushi Bar", type: "Japanese", terminal: "Terminal 5", rating: 4.5, priceRange: "$$$", hours: "6:00 AM - 10:00 PM" },
      { name: "Deep Blue Sushi", type: "Sushi", terminal: "Terminal 1", rating: 4.2, priceRange: "$$", hours: "6:00 AM - 9:00 PM" },
      { name: "Dunkin'", type: "Coffee & Donuts", terminal: "All Terminals", rating: 4.0, priceRange: "$", hours: "4:30 AM - 11:00 PM" },
    ],
    restrooms: [
      { location: "Terminal 1 - Near Gate 1, after security checkpoint", accessible: true, showers: false },
      { location: "Terminal 4 - Level 3, next to food court", accessible: true, showers: true },
      { location: "Terminal 5 - Gates B20-B31, near Duty Free", accessible: true, showers: false },
      { location: "Terminal 8 - Central area, opposite Gate 42", accessible: true, showers: true },
    ],
    reviews: [
      { author: "Michael T.", rating: 4, date: "Dec 2025", text: "Terminal 5 is great for dining. Plenty of outlets and comfortable seating areas. TSA can be slow during peak hours.", helpful: 142 },
      { author: "Sarah K.", rating: 3, date: "Nov 2025", text: "Navigating between terminals requires the AirTrain. Give yourself extra time for connections. Food options are decent but pricey.", helpful: 98 },
      { author: "James L.", rating: 5, date: "Jan 2026", text: "Recently renovated Terminal 4 is excellent. Clean, modern, and the lounges are top-notch. Highly recommend arriving early to enjoy.", helpful: 67 },
    ],
  },
  LAX: {
    food: [
      { name: "In-N-Out Burger", type: "Fast Food", terminal: "Terminal 2", rating: 4.6, priceRange: "$", hours: "6:00 AM - 12:00 AM" },
      { name: "Umami Burger", type: "Gourmet Burgers", terminal: "Terminal 7", rating: 4.4, priceRange: "$$", hours: "6:00 AM - 10:00 PM" },
      { name: "Lemonade", type: "California Cuisine", terminal: "Tom Bradley", rating: 4.3, priceRange: "$$", hours: "5:30 AM - 11:00 PM" },
      { name: "Ink.sack", type: "Sandwiches", terminal: "Terminal 4", rating: 4.5, priceRange: "$$", hours: "6:00 AM - 9:00 PM" },
    ],
    restrooms: [
      { location: "Tom Bradley - Near Gate 155, next to Nike store", accessible: true, showers: true },
      { location: "Terminal 1 - Post-security, left of food court", accessible: true, showers: false },
      { location: "Terminal 4 - Gate 46 area, family restroom available", accessible: true, showers: false },
      { location: "Terminal 7 - Near United Club, includes nursing room", accessible: true, showers: true },
    ],
    reviews: [
      { author: "David R.", rating: 4, date: "Jan 2026", text: "LAX has improved a lot! The connector between terminals is a game changer. Still crowded but manageable.", helpful: 234 },
      { author: "Emily W.", rating: 3, date: "Dec 2025", text: "Tom Bradley International is beautiful but gets extremely crowded. Recommend Priority Pass for lounge access.", helpful: 156 },
      { author: "Chris M.", rating: 4, date: "Nov 2025", text: "Great food options especially In-N-Out. Security lines can be long - use Clear if you have it.", helpful: 89 },
    ],
  },
  LHR: {
    food: [
      { name: "Gordon Ramsay Plane Food", type: "British", terminal: "Terminal 5", rating: 4.4, priceRange: "$$$", hours: "5:00 AM - 10:00 PM" },
      { name: "The Perfectionist's Café", type: "Café", terminal: "Terminal 2", rating: 4.3, priceRange: "$$", hours: "6:00 AM - 9:00 PM" },
      { name: "Wagamama", type: "Asian", terminal: "Terminal 3", rating: 4.2, priceRange: "$$", hours: "5:30 AM - 10:00 PM" },
      { name: "Pret A Manger", type: "Sandwiches", terminal: "All Terminals", rating: 4.1, priceRange: "$", hours: "5:00 AM - 11:00 PM" },
    ],
    restrooms: [
      { location: "Terminal 5 - After security, near Harrods", accessible: true, showers: true },
      { location: "Terminal 2 - Queen's Terminal, Gate B area", accessible: true, showers: true },
      { location: "Terminal 3 - Near Gate 14, family facilities available", accessible: true, showers: false },
      { location: "Terminal 4 - Central departures, opposite WHSmith", accessible: true, showers: true },
    ],
    reviews: [
      { author: "Emma B.", rating: 5, date: "Jan 2026", text: "Terminal 5 is world-class. Excellent shopping, dining, and the Galleries lounges are superb. Easy connections.", helpful: 312 },
      { author: "Robert H.", rating: 4, date: "Dec 2025", text: "Well organized airport. The Elizabeth Line makes getting here so much easier. Book Fast Track security!", helpful: 187 },
      { author: "Anna S.", rating: 3, date: "Nov 2025", text: "Can be overwhelming due to size. Download the Heathrow app for navigation. T2-T5 transfer takes time.", helpful: 124 },
    ],
  },
  CDG: {
    food: [
      { name: "Ladurée", type: "Patisserie", terminal: "Terminal 2E", rating: 4.5, priceRange: "$$$", hours: "6:00 AM - 10:00 PM" },
      { name: "Café Prunier", type: "French Seafood", terminal: "Terminal 2F", rating: 4.3, priceRange: "$$$", hours: "7:00 AM - 9:00 PM" },
      { name: "Brioche Dorée", type: "Bakery", terminal: "All Terminals", rating: 4.0, priceRange: "$", hours: "5:00 AM - 11:00 PM" },
      { name: "Paul", type: "French Bakery", terminal: "Terminal 1", rating: 4.2, priceRange: "$$", hours: "5:30 AM - 10:00 PM" },
    ],
    restrooms: [
      { location: "Terminal 2E - Hall L, past Duty Free on the right", accessible: true, showers: true },
      { location: "Terminal 2F - Gate F40 area, next to pharmacy", accessible: true, showers: false },
      { location: "Terminal 1 - Satellite 3, near Gate 32", accessible: true, showers: true },
      { location: "Terminal 2G - Central area, includes baby changing", accessible: true, showers: false },
    ],
    reviews: [
      { author: "Pierre L.", rating: 3, date: "Jan 2026", text: "Large and confusing airport. Allow plenty of time for connections. The CDGVAL train between terminals is efficient.", helpful: 256 },
      { author: "Marie D.", rating: 4, date: "Dec 2025", text: "Terminal 2E is beautifully designed. The Air France lounge is excellent. Duty free shopping is great.", helpful: 145 },
      { author: "Thomas K.", rating: 3, date: "Nov 2025", text: "Security lines can be unpredictable. The food is surprisingly good for an airport. Wi-Fi is free but slow.", helpful: 98 },
    ],
  },
  DXB: {
    food: [
      { name: "The Irish Village", type: "Pub & Grill", terminal: "Terminal 3", rating: 4.4, priceRange: "$$", hours: "24 hours" },
      { name: "Café Bateel", type: "Middle Eastern", terminal: "Terminal 1", rating: 4.5, priceRange: "$$$", hours: "6:00 AM - 12:00 AM" },
      { name: "Shake Shack", type: "Burgers", terminal: "Terminal 3", rating: 4.3, priceRange: "$$", hours: "24 hours" },
      { name: "Tim Hortons", type: "Coffee", terminal: "All Terminals", rating: 4.1, priceRange: "$", hours: "24 hours" },
    ],
    restrooms: [
      { location: "Terminal 3 - Concourse A, near Gate A1 (includes prayer rooms)", accessible: true, showers: true },
      { location: "Terminal 3 - Concourse B, opposite Business Class lounge", accessible: true, showers: true },
      { location: "Terminal 1 - After immigration, near Duty Free entrance", accessible: true, showers: true },
      { location: "Terminal 2 - Central hall, spa showers available nearby", accessible: true, showers: true },
    ],
    reviews: [
      { author: "Ahmed K.", rating: 5, date: "Jan 2026", text: "One of the best airports in the world. 24/7 operations, incredible duty free, and the Emirates lounges are amazing.", helpful: 445 },
      { author: "Lisa M.", rating: 5, date: "Dec 2025", text: "Terminal 3 is massive but well-designed. Free sleeping pods in some areas. Excellent for long layovers.", helpful: 312 },
      { author: "John P.", rating: 4, date: "Nov 2025", text: "Great airport but can be overwhelming. Download the DXB app. Spa services and sleep pods are a nice touch.", helpful: 198 },
    ],
  },
  SIN: {
    food: [
      { name: "A Noodle Story", type: "Singaporean", terminal: "Terminal 3", rating: 4.6, priceRange: "$$", hours: "24 hours" },
      { name: "Violet Oon Singapore", type: "Peranakan", terminal: "Terminal 4", rating: 4.5, priceRange: "$$$", hours: "6:00 AM - 11:00 PM" },
      { name: "Tiger Street Lab", type: "Craft Beer & Food", terminal: "Terminal 2", rating: 4.3, priceRange: "$$", hours: "24 hours" },
      { name: "Song Fa Bak Kut Teh", type: "Local", terminal: "Terminal 3", rating: 4.7, priceRange: "$$", hours: "24 hours" },
    ],
    restrooms: [
      { location: "Terminal 3 - Near Butterfly Garden, premium facilities", accessible: true, showers: true },
      { location: "Terminal 1 - Transit area, includes rain showers", accessible: true, showers: true },
      { location: "Terminal 4 - Heritage zone, modern design", accessible: true, showers: true },
      { location: "Jewel Changi - Level 5, next to Canopy Park", accessible: true, showers: true },
    ],
    reviews: [
      { author: "Wei L.", rating: 5, date: "Jan 2026", text: "Best airport in the world! The Jewel is incredible. Free tours, movie theater, butterfly garden - you'll want a long layover.", helpful: 567 },
      { author: "Rachel T.", rating: 5, date: "Dec 2025", text: "Changi never disappoints. Free foot massage chairs, gaming zones, and the food is authentic local cuisine.", helpful: 423 },
      { author: "Mark S.", rating: 5, date: "Nov 2025", text: "Transit hotels, free showers, rooftop pool - this airport has everything. The rain vortex at Jewel is breathtaking.", helpful: 356 },
    ],
  },
  WAW: {
    food: [
      { name: "Olimp", type: "Polish Traditional", terminal: "Terminal A", rating: 4.2, priceRange: "$$", hours: "5:00 AM - 10:00 PM" },
      { name: "Sphinx", type: "Middle Eastern", terminal: "Terminal A", rating: 4.0, priceRange: "$$", hours: "6:00 AM - 9:00 PM" },
      { name: "Costa Coffee", type: "Coffee", terminal: "All Areas", rating: 4.1, priceRange: "$", hours: "4:30 AM - 11:00 PM" },
      { name: "Blikle", type: "Polish Patisserie", terminal: "Terminal A", rating: 4.4, priceRange: "$$", hours: "5:30 AM - 10:00 PM" },
    ],
    restrooms: [
      { location: "Terminal A - After passport control, near Gate 25", accessible: true, showers: false },
      { location: "Non-Schengen area - Gate 35 vicinity", accessible: true, showers: true },
      { location: "Arrivals hall - Near baggage claim 3", accessible: true, showers: false },
      { location: "Schengen area - Between Gates 12-15", accessible: true, showers: false },
    ],
    reviews: [
      { author: "Piotr N.", rating: 4, date: "Jan 2026", text: "Modern and efficient airport. LOT hub works smoothly. Try the Polish doughnuts at Blikle before your flight!", helpful: 87 },
      { author: "Katarzyna W.", rating: 4, date: "Dec 2025", text: "Good connections to city center. Lounges are comfortable. Security is fast compared to other European hubs.", helpful: 65 },
      { author: "Hans B.", rating: 3, date: "Nov 2025", text: "Decent airport, not huge. Limited shopping but adequate food options. Free Wi-Fi works well.", helpful: 43 },
    ],
  },
  PRG: {
    food: [
      { name: "Pilsner Urquell Original", type: "Czech Pub", terminal: "Terminal 2", rating: 4.4, priceRange: "$$", hours: "6:00 AM - 10:00 PM" },
      { name: "Bohemia Bagel", type: "Café", terminal: "Terminal 1", rating: 4.1, priceRange: "$", hours: "5:00 AM - 9:00 PM" },
      { name: "Ambiente", type: "Czech & International", terminal: "Terminal 2", rating: 4.3, priceRange: "$$$", hours: "7:00 AM - 10:00 PM" },
      { name: "Starbucks", type: "Coffee", terminal: "Both Terminals", rating: 4.0, priceRange: "$$", hours: "5:00 AM - 11:00 PM" },
    ],
    restrooms: [
      { location: "Terminal 1 - Gate C area, past Duty Free", accessible: true, showers: false },
      { location: "Terminal 2 - Schengen departures, near Gate D5", accessible: true, showers: true },
      { location: "Arrivals - Near car rental desks", accessible: true, showers: false },
      { location: "Terminal 2 - Business lounge corridor", accessible: true, showers: true },
    ],
    reviews: [
      { author: "Martin H.", rating: 4, date: "Jan 2026", text: "Compact and easy to navigate. The Pilsner Urquell bar is a must-visit. Quick connections possible.", helpful: 112 },
      { author: "Jana K.", rating: 4, date: "Dec 2025", text: "Clean and modern airport. Good duty-free shops. Public transport to city center is convenient.", helpful: 78 },
      { author: "Oliver M.", rating: 5, date: "Nov 2025", text: "Underrated airport! Efficient, not overcrowded, and great Czech beer selection. Love the quick security.", helpful: 56 },
    ],
  },
  FRA: {
    food: [
      { name: "Paulaner", type: "Bavarian", terminal: "Terminal 1", rating: 4.3, priceRange: "$$", hours: "6:00 AM - 11:00 PM" },
      { name: "7 Continents", type: "International", terminal: "Terminal 2", rating: 4.2, priceRange: "$$$", hours: "6:00 AM - 10:00 PM" },
      { name: "Caviar House", type: "Seafood", terminal: "Terminal 1", rating: 4.5, priceRange: "$$$$", hours: "7:00 AM - 9:00 PM" },
      { name: "Hermann's", type: "German", terminal: "Terminal 1", rating: 4.1, priceRange: "$$", hours: "5:30 AM - 10:00 PM" },
    ],
    restrooms: [
      { location: "Terminal 1 - Pier A, near Gate A50", accessible: true, showers: true },
      { location: "Terminal 1 - Pier B, opposite Lufthansa lounge", accessible: true, showers: true },
      { location: "Terminal 2 - Gate D area, premium facilities", accessible: true, showers: true },
      { location: "Long-distance train station - Level 0", accessible: true, showers: false },
    ],
    reviews: [
      { author: "Klaus M.", rating: 4, date: "Jan 2026", text: "Huge airport but well-organized. The Lufthansa First Class Terminal is world-class. Allow time for connections.", helpful: 234 },
      { author: "Sophie B.", rating: 3, date: "Dec 2025", text: "Can be stressful during rush hour. The SkyLine train between terminals is essential. Decent shopping.", helpful: 156 },
      { author: "Michael K.", rating: 4, date: "Nov 2025", text: "Great hub for European connections. Excellent train links to the city. German efficiency at its best.", helpful: 98 },
    ],
  },
  AMS: {
    food: [
      { name: "Heineken Bar", type: "Dutch Pub", terminal: "Lounge 2", rating: 4.2, priceRange: "$$", hours: "6:00 AM - 11:00 PM" },
      { name: "Kebaya", type: "Indonesian-Dutch", terminal: "Lounge 3", rating: 4.4, priceRange: "$$$", hours: "7:00 AM - 10:00 PM" },
      { name: "Dutch Kitchen", type: "Traditional Dutch", terminal: "Lounge 1", rating: 4.1, priceRange: "$$", hours: "6:00 AM - 9:00 PM" },
      { name: "La Place", type: "Market Kitchen", terminal: "All Areas", rating: 4.3, priceRange: "$$", hours: "5:00 AM - 11:00 PM" },
    ],
    restrooms: [
      { location: "Lounge 2 - Near Holland Boulevard, excellent facilities", accessible: true, showers: true },
      { location: "Lounge 3 - Past E Gates, family room available", accessible: true, showers: true },
      { location: "Arrivals - Near Meeting Point, showers in hotel annex", accessible: true, showers: true },
      { location: "D Gates - Near Rijksmuseum branch", accessible: true, showers: false },
    ],
    reviews: [
      { author: "Lars V.", rating: 5, date: "Jan 2026", text: "Love Schiphol! The Rijksmuseum exhibit and Holland Boulevard make layovers enjoyable. Great bike parking too!", helpful: 289 },
      { author: "Emma D.", rating: 4, date: "Dec 2025", text: "One terminal makes connections easy. Good lounges and the library is unique. Can get crowded.", helpful: 178 },
      { author: "Peter J.", rating: 4, date: "Nov 2025", text: "Efficient and well-designed. Plenty of charging spots. The casino is a fun way to pass time.", helpful: 134 },
    ],
  },
  IST: {
    food: [
      { name: "Kebapçı Mahmut", type: "Turkish Kebab", terminal: "International", rating: 4.5, priceRange: "$$", hours: "24 hours" },
      { name: "Kahve Dünyası", type: "Turkish Coffee", terminal: "All Areas", rating: 4.3, priceRange: "$", hours: "24 hours" },
      { name: "Big Chefs", type: "International", terminal: "Departures", rating: 4.2, priceRange: "$$$", hours: "24 hours" },
      { name: "Mado", type: "Turkish Ice Cream & Desserts", terminal: "Transit Area", rating: 4.4, priceRange: "$$", hours: "24 hours" },
    ],
    restrooms: [
      { location: "International Terminal - Near Gate F, includes hammam-style facilities", accessible: true, showers: true },
      { location: "Domestic Terminal - Post-security, near mosques", accessible: true, showers: true },
      { location: "Transfer area - Between gates, spa nearby", accessible: true, showers: true },
      { location: "Arrivals - Near CIP lounge, premium services", accessible: true, showers: true },
    ],
    reviews: [
      { author: "Mehmet A.", rating: 5, date: "Jan 2026", text: "Incredible new airport! Massive but well-designed. The Turkish Airlines lounge is like a 5-star hotel.", helpful: 445 },
      { author: "Christina L.", rating: 4, date: "Dec 2025", text: "Beautiful architecture and excellent duty-free. Transfer process is smooth. Try the authentic Turkish food!", helpful: 312 },
      { author: "Hans R.", rating: 4, date: "Nov 2025", text: "New IST is impressive. Walking distances are long but moving walkways help. Great for long layovers.", helpful: 234 },
    ],
  },
  HND: {
    food: [
      { name: "Rokurinsha", type: "Ramen", terminal: "Terminal 3", rating: 4.7, priceRange: "$$", hours: "6:00 AM - 10:00 PM" },
      { name: "Sushi Kyotatsu", type: "Sushi", terminal: "Terminal 2", rating: 4.5, priceRange: "$$$", hours: "7:00 AM - 9:00 PM" },
      { name: "Edo Koji", type: "Japanese Food Court", terminal: "Terminal 3", rating: 4.4, priceRange: "$$", hours: "24 hours" },
      { name: "Tsurutontan", type: "Udon", terminal: "Terminal 2", rating: 4.6, priceRange: "$$", hours: "6:30 AM - 10:00 PM" },
    ],
    restrooms: [
      { location: "Terminal 3 - Near Edo Koji, Japanese-style toilets", accessible: true, showers: true },
      { location: "Terminal 2 - Gate 60 area, includes grooming rooms", accessible: true, showers: true },
      { location: "Terminal 1 - Domestic departures, modern facilities", accessible: true, showers: false },
      { location: "International arrivals - Near customs, baby care rooms", accessible: true, showers: true },
    ],
    reviews: [
      { author: "Yuki T.", rating: 5, date: "Jan 2026", text: "Cleanest airport ever! The food is incredible - try the tsukemen at Rokurinsha. Efficient and quiet.", helpful: 356 },
      { author: "Alex W.", rating: 5, date: "Dec 2025", text: "Terminal 3 international is beautiful. Close to central Tokyo. Amazing attention to detail everywhere.", helpful: 278 },
      { author: "Jennifer L.", rating: 4, date: "Nov 2025", text: "Prefer Haneda over Narita for convenience. Excellent food, super clean restrooms. Very Japanese efficiency.", helpful: 198 },
    ],
  },
  NRT: {
    food: [
      { name: "Nakau", type: "Japanese Fast Food", terminal: "Terminal 1", rating: 4.2, priceRange: "$", hours: "6:00 AM - 9:00 PM" },
      { name: "Sakura Lounge Restaurant", type: "Japanese", terminal: "Terminal 2", rating: 4.4, priceRange: "$$$", hours: "7:00 AM - 9:00 PM" },
      { name: "Mos Burger", type: "Fast Food", terminal: "All Terminals", rating: 4.1, priceRange: "$", hours: "6:00 AM - 10:00 PM" },
      { name: "Soba House", type: "Noodles", terminal: "Terminal 1", rating: 4.3, priceRange: "$$", hours: "7:00 AM - 8:00 PM" },
    ],
    restrooms: [
      { location: "Terminal 1 - North Wing, near Gate 31", accessible: true, showers: true },
      { location: "Terminal 2 - Main Building, opposite food court", accessible: true, showers: true },
      { location: "Terminal 3 - LCC terminal, basic but clean", accessible: true, showers: false },
      { location: "Satellite Building - Near Gate 91", accessible: true, showers: true },
    ],
    reviews: [
      { author: "Kenji M.", rating: 4, date: "Jan 2026", text: "Classic international airport. A bit far from Tokyo but Narita Express is convenient. Good duty-free.", helpful: 189 },
      { author: "Sophie T.", rating: 3, date: "Dec 2025", text: "Showing its age compared to newer Asian airports. Still efficient and clean. Limited night flight options.", helpful: 145 },
      { author: "David L.", rating: 4, date: "Nov 2025", text: "Terminal 3 is budget-friendly. Good connections and signage. The capsule hotel nearby is convenient.", helpful: 112 },
    ],
  },
  ICN: {
    food: [
      { name: "Korean Air Bibimbap", type: "Korean", terminal: "Terminal 2", rating: 4.5, priceRange: "$$", hours: "24 hours" },
      { name: "Shake Shack", type: "Burgers", terminal: "Terminal 1", rating: 4.3, priceRange: "$$", hours: "7:00 AM - 10:00 PM" },
      { name: "Tosokchon Samgyetang", type: "Korean Traditional", terminal: "Terminal 1", rating: 4.6, priceRange: "$$", hours: "6:00 AM - 10:00 PM" },
      { name: "Paris Baguette", type: "Bakery", terminal: "All Terminals", rating: 4.2, priceRange: "$", hours: "24 hours" },
    ],
    restrooms: [
      { location: "Terminal 1 - Near Korean Cultural Center, premium facilities", accessible: true, showers: true },
      { location: "Terminal 2 - Airside, includes sauna area", accessible: true, showers: true },
      { location: "Concourse A - Near transit hotel", accessible: true, showers: true },
      { location: "Arrivals - Near meet & greet area", accessible: true, showers: false },
    ],
    reviews: [
      { author: "Min-Jun K.", rating: 5, date: "Jan 2026", text: "World-class airport! Free showers, Korean cultural experiences, gaming zones, and incredible food. Love it.", helpful: 423 },
      { author: "Amanda S.", rating: 5, date: "Dec 2025", text: "The free transit tour is amazing. Spa, sleeping pods, ice skating rink - best layover airport.", helpful: 356 },
      { author: "Tom H.", rating: 5, date: "Nov 2025", text: "Terminal 2 is stunning. Fast Wi-Fi, great lounges, and the duty-free prices are actually competitive.", helpful: 267 },
    ],
  },
};

export function getAirportAmenities(iata: string): AirportAmenities {
  return AIRPORT_AMENITIES[iata] || {
    food: [
      { name: "Airport Café", type: "Café & Snacks", terminal: "Main Terminal", rating: 3.8, priceRange: "$", hours: "6:00 AM - 10:00 PM" },
      { name: "International Deli", type: "Sandwiches", terminal: "Departures", rating: 3.9, priceRange: "$$", hours: "5:30 AM - 9:00 PM" },
      { name: "Coffee Corner", type: "Coffee", terminal: "All Areas", rating: 4.0, priceRange: "$", hours: "24 hours" },
    ],
    restrooms: [
      { location: "Main Terminal - Near check-in counters", accessible: true, showers: false },
      { location: "Departures - After security checkpoint", accessible: true, showers: true },
      { location: "Arrivals - Near baggage claim", accessible: true, showers: false },
    ],
    reviews: [
      { author: "Traveler", rating: 4, date: "Dec 2025", text: "Standard international airport with good facilities. Clean and functional.", helpful: 45 },
      { author: "Frequent Flyer", rating: 3, date: "Nov 2025", text: "Gets the job done. Some areas could use updates but overall a decent experience.", helpful: 32 },
    ],
  };
}
