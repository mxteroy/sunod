import { getAudioManager } from "@/core/audio/AudioManager";
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import type { SpaceEvent } from "@shared/schema";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscription } from "react-relay";
import type { GraphQLSubscriptionConfig } from "relay-runtime";
import { graphql } from "relay-runtime";

const subscription = graphql`
  subscription TestDemoSpaceEventsSubscription {
    demoSpaceEvents
  }
`;

export default function Test() {
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasReceivedEvents = useRef(false);

  console.log("Test component render");

  const subscriptionConfig: GraphQLSubscriptionConfig<any> = useMemo(
    () => ({
      subscription,
      variables: {},
      onNext: (response) => {
        if (response?.demoSpaceEvents && !hasReceivedEvents.current) {
          const data = response.demoSpaceEvents;

          // Check if data has sounds + events structure (new format)
          // or is just an array of events (old format)
          let newEvents: SpaceEvent[];

          if (data.sounds && data.events) {
            // New format: { sounds: [...], events: [...] }
            console.log(
              `Received ${data.sounds.length} sounds and ${data.events.length} events from server`
            );

            // Register sounds with AudioManager with app-specific namespace
            const audioManager = getAudioManager();
            audioManager.registerSounds(data.sounds, "test-space");
            console.log(
              "✅ Sounds registered with AudioManager for test-space"
            );

            newEvents = data.events;
          } else if (Array.isArray(data)) {
            // Old format: just array of events
            newEvents = data;
            console.log(`Received ${newEvents.length} event(s) from server`);
          } else {
            // Single event
            newEvents = [data];
            console.log(`Received 1 event from server`);
          }

          // Set events only once to prevent duplicates
          hasReceivedEvents.current = true;
          setEvents(newEvents);
          setLoading(false);
        }
      },
      onError: (err) => {
        console.error("Subscription error:", err);
        setError(err.message || "Subscription failed");
        setLoading(false);
      },
      onCompleted: () => {
        console.log("Subscription complete - all events received");
      },
    }),
    []
  ); // Empty deps - only create once

  useSubscription(subscriptionConfig);

  useEffect(() => {
    console.log("Test mounted - subscription active");
  }, []);

  console.log("Test render - total events:", events.length);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16 }}>Loading demo space...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "red", marginBottom: 8 }}>Error: {error}</Text>
          <Text>Make sure the server is running on port 3001</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <EventBasedRenderer events={events} spaceId="test-space" />
    </SafeAreaView>
  );
}
