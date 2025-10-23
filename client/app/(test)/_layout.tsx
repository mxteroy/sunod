import { Stack } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal", // feel free to remove if you don’t want modal feel
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
