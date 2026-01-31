import { Tabs } from "expo-router";
import { Plane, Map } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0A1628",
          borderTopColor: "rgba(0, 212, 255, 0.1)",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#00D4FF",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Flights",
          tabBarIcon: ({ color, size }) => <Plane color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
