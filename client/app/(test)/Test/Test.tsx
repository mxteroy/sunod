import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import type { SpaceEvent } from "@shared/schema";
import { useEffect, useRef, useState } from "react";
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
  const eventsRef = useRef<SpaceEvent[]>([]);

  console.log("asdf;lkajsdf;lkajsdfl;kaj");
  const subscriptionConfig: GraphQLSubscriptionConfig<any> = {
    subscription,
    variables: {},
    onNext: (response) => {
      if (response?.demoSpaceEvents) {
        const event = response.demoSpaceEvents as SpaceEvent;
        console.log("Received event from server:", event.event);

        // Add event to the list
        eventsRef.current = [...eventsRef.current, event];
        setEvents([...eventsRef.current]);

        // Hide loading on first event
        if (loading) {
          setLoading(false);
        }
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
  };

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
