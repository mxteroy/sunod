import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import { interactiveDraggableEvents } from "@/core/renderer/eventExamples";
import type { SpaceEvent } from "@shared/schema";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [events, setEvents] = useState<SpaceEvent[]>([]);

  useEffect(() => {
    console.log(
      "HomeScreen mounted - loading interactive draggable demo incrementally"
    );

    // Start with just shared values and root
    const initialEvents = interactiveDraggableEvents.slice(0, 15); // All shared values + root
    setEvents(initialEvents);
    console.log("Initial render with", initialEvents.length, "events");

    // Add main draggable after 300ms
    setTimeout(() => {
      const draggableEvents = interactiveDraggableEvents.slice(0, 17); // Include draggable view
      setEvents(draggableEvents);
      console.log("Added draggable container");
    }, 300);

    // Add inner elements progressively
    setTimeout(() => {
      const withInner = interactiveDraggableEvents.slice(0, 25); // Add all inner elements
      setEvents(withInner);
      console.log("Added inner elements");
    }, 600);

    // Add controller draggable
    setTimeout(() => {
      const withController = interactiveDraggableEvents.slice(0, 29); // Include controller
      setEvents(withController);
      console.log("Added controller");
    }, 900);

    // Add title
    setTimeout(() => {
      const withTitle = interactiveDraggableEvents.slice(0, 31);
      setEvents(withTitle);
      console.log("Added title");
    }, 1200);

    // Add button
    setTimeout(() => {
      const withButton = interactiveDraggableEvents.slice(0, 33);
      setEvents(withButton);
      console.log("Added button");
    }, 1500);

    // Add status text (complete)
    setTimeout(() => {
      setEvents(interactiveDraggableEvents);
      console.log(
        "Fully loaded! Total events:",
        interactiveDraggableEvents.length
      );
    }, 1800);
  }, []);

  console.log("HomeScreen render - total events:", events.length);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <EventBasedRenderer events={events} />
    </SafeAreaView>
  );
}
