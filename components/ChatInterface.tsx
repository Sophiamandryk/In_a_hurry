import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Send, Plane, AlertCircle, X } from "lucide-react-native";
import { z } from "zod";
import { createRorkTool, useRorkAgent } from "@rork-ai/toolkit-sdk";
import { getFlights, Flight } from "@/services/aviationStack";
import { CLOSED_AIRPORTS_INFO, Airport } from "@/constants/airports";
import FlightCard from "./FlightCard";

interface ChatInterfaceProps {
  onFlightsFound?: (flights: Flight[]) => void;
  originAirport?: Airport | null;
  destinationAirport?: Airport | null;
  onClearSelection?: () => void;
  persistedFlights?: Flight[];
  onClearFlights?: () => void;
}

const closedAirportsList = Object.entries(CLOSED_AIRPORTS_INFO)
  .map(([code, info]) => `${code}: ${info}`)
  .join("\n");

export default function ChatInterface({ 
  onFlightsFound, 
  originAirport, 
  destinationAirport,
  onClearSelection,
  persistedFlights = [],
  onClearFlights
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const foundFlights = persistedFlights;
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [hasPrefilledPrompt, setHasPrefilledPrompt] = useState(false);

  const { messages, error, sendMessage, status } = useRorkAgent({
    systemPrompt: `You are a flight search assistant. Help users find flights between airports. Be concise and direct in your responses. Do not use markdown formatting like asterisks, bullet points, or headers.

When a user asks about flights, extract the origin and destination airports and call the get_flight_info tool.
- If the user mentions a city name, identify the main airport IATA code (e.g., Warsaw = WAW, Amsterdam = AMS, New York = JFK)
- If the user mentions a country, ask them to specify a city or use the main international airport

IMPORTANT - CLOSED AIRPORTS:
The following airports are currently closed and cannot be used for flights:
${closedAirportsList}

All Ukrainian airports have been closed since February 2022 due to the ongoing war. Ukrainian airspace remains closed to civilian traffic. If a user asks about flights to/from Ukraine or any Ukrainian city (Kyiv, Lviv, Odesa, Kharkiv, etc.), inform them that these airports are not operational and suggest nearby alternatives like Warsaw (WAW) or Krakow (KRK) in Poland.

Common IATA codes: WAW (Warsaw), AMS (Amsterdam), JFK (New York), LHR (London), CDG (Paris), FRA (Frankfurt), DXB (Dubai), SIN (Singapore)

Keep responses short and to the point. No bullet points or special formatting.`,
    tools: {
      get_flight_info: createRorkTool({
        description: "Get flight information between two airports using IATA codes",
        zodSchema: z.object({
          loc_origin: z
            .string()
            .describe("Departure airport IATA code (e.g., WAW for Warsaw, AMS for Amsterdam)"),
          loc_destination: z
            .string()
            .describe("Destination airport IATA code (e.g., JFK for New York, LHR for London)"),
        }),
        async execute(toolInput) {
          console.log("[ChatInterface] Tool called with:", toolInput);
          setIsSearching(true);

          try {
            const result = await getFlights(
              toolInput.loc_origin.toUpperCase(),
              toolInput.loc_destination.toUpperCase()
            );

            console.log("[ChatInterface] Flight search result:", result);

            if (result.error) {
              setIsSearching(false);
              return {
                success: false,
                error: result.error,
                message: `Error searching flights: ${result.error}`,
              };
            }

            setIsSearching(false);

            if (result.flights.length === 0) {
              if (result.nextAvailableFlight) {
                const nextFlight = result.nextAvailableFlight;
                onFlightsFound?.([...foundFlights, nextFlight]);
                return {
                  success: true,
                  flights: [{
                    flight: nextFlight.flight.iata,
                    airline: nextFlight.airline.name,
                    departure: nextFlight.departure.scheduled,
                    arrival: nextFlight.arrival.scheduled,
                    status: nextFlight.flightStatus,
                  }],
                  message: `No flights available right now, but found the next available flight: ${nextFlight.flight.iata} by ${nextFlight.airline.name} departing on ${nextFlight.departure.scheduled}`,
                };
              }
              return {
                success: true,
                flights: [],
                message: `No scheduled flights found from ${toolInput.loc_origin} to ${toolInput.loc_destination}. This could be because there are no direct flights on this route, or no flights are scheduled in the near future.`,
              };
            }

            onFlightsFound?.([...foundFlights, ...result.flights]);

            const flightSummary = result.flights.slice(0, 5).map((f) => ({
              flight: f.flight.iata,
              airline: f.airline.name,
              departure: f.departure.scheduled,
              arrival: f.arrival.scheduled,
              status: f.flightStatus,
            }));

            return {
              success: true,
              totalFlights: result.flights.length,
              flights: flightSummary,
              message: `Found ${result.flights.length} flights from ${toolInput.loc_origin} to ${toolInput.loc_destination}`,
            };
          } catch (err) {
            console.error("[ChatInterface] Tool execution error:", err);
            setIsSearching(false);
            return {
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
            };
          }
        },
      }),
    },
  });

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (originAirport && !hasPrefilledPrompt) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      
      let prompt: string;
      if (destinationAirport) {
        prompt = `Find flights from ${originAirport.iata} (${originAirport.city}) to ${destinationAirport.iata} (${destinationAirport.city}). Current time: ${timeStr}, ${dateStr}.`;
      } else {
        prompt = `Find flights departing from ${originAirport.iata} (${originAirport.city}). Current time: ${timeStr}, ${dateStr}.`;
      }
      
      console.log("[ChatInterface] Pre-filling prompt:", prompt);
      setInput(prompt);
      setHasPrefilledPrompt(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [originAirport, destinationAirport, hasPrefilledPrompt]);

  useEffect(() => {
    if (!originAirport || !destinationAirport) {
      setHasPrefilledPrompt(false);
    }
  }, [originAirport, destinationAirport]);

  const handleSend = () => {
    if (!input.trim()) return;
    console.log("[ChatInterface] Sending message:", input);
    onClearFlights?.();
    sendMessage(input);
    setInput("");
    Keyboard.dismiss();
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === "user";

    return (
      <View
        key={message.id || index}
        style={[styles.messageBubble, isUser ? styles.userMessage : styles.assistantMessage]}
      >
        {message.parts?.map((part: any, partIndex: number) => {
          if (part.type === "text") {
            return (
              <Text
                key={partIndex}
                style={[styles.messageText, isUser && styles.userMessageText]}
              >
                {part.text}
              </Text>
            );
          }

          if (part.type === "tool") {
            if (part.state === "input-streaming" || part.state === "input-available") {
              return (
                <View key={partIndex} style={styles.toolCall}>
                  <ActivityIndicator size="small" color="#00D4FF" />
                  <Text style={styles.toolCallText}>
                    Searching flights...
                  </Text>
                </View>
              );
            }

            if (part.state === "output-available") {
              return (
                <View key={partIndex} style={styles.toolResult}>
                  <Plane size={14} color="#4ADE80" />
                  <Text style={styles.toolResultText}>
                    Flight search completed
                  </Text>
                </View>
              );
            }

            if (part.state === "output-error") {
              return (
                <View key={partIndex} style={styles.toolError}>
                  <AlertCircle size={14} color="#F87171" />
                  <Text style={styles.toolErrorText}>
                    {part.errorText || "Search failed"}
                  </Text>
                </View>
              );
            }
          }

          return null;
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 180 : 100}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Plane size={40} color="#00D4FF" />
            <Text style={styles.welcomeTitle}>Flight Search Assistant</Text>
            {originAirport ? (
              <View style={styles.selectedRouteContainer}>
                <View style={styles.selectedAirportBadge}>
                  <Text style={styles.selectedAirportLabel}>From</Text>
                  <Text style={styles.selectedAirportCode}>{originAirport.iata}</Text>
                  <Text style={styles.selectedAirportCity}>{originAirport.city}</Text>
                </View>
                {destinationAirport ? (
                  <>
                    <Text style={styles.routeArrow}>→</Text>
                    <View style={styles.selectedAirportBadge}>
                      <Text style={styles.selectedAirportLabel}>To</Text>
                      <Text style={styles.selectedAirportCode}>{destinationAirport.iata}</Text>
                      <Text style={styles.selectedAirportCity}>{destinationAirport.city}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.selectDestinationHint}>
                    Select destination on map or type below
                  </Text>
                )}
                <TouchableOpacity 
                  style={styles.clearSelectionButton}
                  onPress={onClearSelection}
                >
                  <X size={14} color="#94A3B8" />
                  <Text style={styles.clearSelectionText}>Clear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.welcomeText}>
                Ask me about flights! Try:{"\n\n"}
                "Next flight from Warsaw to Amsterdam?"{"\n\n"}
                "Flights from JFK to London"
              </Text>
            )}
          </View>
        )}

        {messages.map(renderMessage)}

        {isSearching && (
          <View style={styles.searchingIndicator}>
            <ActivityIndicator size="small" color="#00D4FF" />
            <Text style={styles.searchingText}>Searching flights...</Text>
          </View>
        )}

        {foundFlights.length > 0 && (
          <View style={styles.flightsContainer}>
            <Text style={styles.flightsTitle}>
              {foundFlights.length === 1 ? 'Next available flight' : `Found ${foundFlights.length} flights`}
            </Text>
            {foundFlights.slice(0, 5).map((flight, index) => (
              <FlightCard key={`${flight.flight.iata}-${index}`} flight={flight} />
            ))}
            {foundFlights.length > 5 && (
              <Text style={styles.moreFlights}>
                +{foundFlights.length - 5} more flights available
              </Text>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color="#F87171" />
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about flights..."
          placeholderTextColor="#64748B"
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || status === "streaming") && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || status === "streaming"}
        >
          {status === "streaming" ? (
            <ActivityIndicator size="small" color="#0A1628" />
          ) : (
            <Send size={20} color="#0A1628" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 16,
  },
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700" as const,
    marginTop: 16,
    marginBottom: 12,
  },
  welcomeText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  selectedRouteContainer: {
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  selectedAirportBadge: {
    backgroundColor: "rgba(0, 212, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    minWidth: 120,
  },
  selectedAirportLabel: {
    color: "#64748B",
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectedAirportCode: {
    color: "#00D4FF",
    fontSize: 24,
    fontWeight: "800" as const,
    letterSpacing: 1,
  },
  selectedAirportCity: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  routeArrow: {
    color: "#00D4FF",
    fontSize: 24,
    fontWeight: "300" as const,
  },
  selectDestinationHint: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  clearSelectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearSelectionText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#00D4FF",
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "#E2E8F0",
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#0A1628",
  },
  toolCall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  toolCallText: {
    color: "#00D4FF",
    fontSize: 13,
  },
  toolResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  toolResultText: {
    color: "#4ADE80",
    fontSize: 12,
  },
  toolError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  toolErrorText: {
    color: "#F87171",
    fontSize: 12,
  },
  searchingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  searchingText: {
    color: "#00D4FF",
    fontSize: 14,
  },
  flightsContainer: {
    marginTop: 16,
  },
  flightsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  moreFlights: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 212, 255, 0.1)",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    color: "#FFFFFF",
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#00D4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
