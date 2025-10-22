import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { docToEvents } from "@/core/renderer/docToEvents";
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import FullSchemaRenderer from "@/core/renderer/FullSchemaRenderer";
import { sampleDoc } from "@/core/sampleDoc";
import type { SpaceEvent } from "@shared/schema";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";

export default function RendererComparisonScreen() {
  const [mode, setMode] = useState<"full" | "events">("events");
  const [events, setEvents] = useState<SpaceEvent[]>(() =>
    docToEvents(sampleDoc)
  );

  const addDynamicItem = () => {
    const newId = `dynamic-${Date.now()}`;
    const newEvents: SpaceEvent[] = [
      {
        event: "createView",
        id: newId,
        type: "Text",
        text: `✨ Added at ${new Date().toLocaleTimeString()}`,
        style: {
          margin: 8,
          padding: 8,
          backgroundColor: { type: "theme", name: "accent" },
          borderRadius: 8,
        },
      },
      {
        event: "addChild",
        parentId: "root",
        childId: newId,
        index: 1, // Add after the first child (draggable container)
      },
    ];

    setEvents([...events, ...newEvents]);
  };

  const removeDynamicItems = () => {
    const dynamicIds = events
      .filter((e) => e.event === "createView" && e.id.startsWith("dynamic-"))
      .map((e) => (e.event === "createView" ? e.id : ""));

    const removeEvents: SpaceEvent[] = dynamicIds.flatMap((id) => [
      {
        event: "removeChild",
        parentId: "root",
        childId: id,
      },
      {
        event: "deleteNode",
        id,
        animated: true,
        duration: 200,
      },
    ]);

    setEvents([...events, ...removeEvents]);
  };

  const updateStyle = () => {
    const styleEvent: SpaceEvent = {
      event: "updateStyle",
      id: "main-title",
      style: {
        backgroundColor: { type: "theme", name: "accent" },
        padding: 16,
      },
      merge: true,
      animated: true,
      duration: 500,
    };

    setEvents([...events, styleEvent]);
  };

  const fullSchemaSize = JSON.stringify(sampleDoc).length;
  const eventsSize = JSON.stringify(events).length;
  const savings = ((1 - eventsSize / fullSchemaSize) * 100).toFixed(1);

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Renderer Comparison</ThemedText>
        <ThemedText style={styles.subtitle}>
          Compare full schema vs event-based rendering
        </ThemedText>
      </ThemedView>

      {/* Stats */}
      <ThemedView style={styles.stats}>
        <ThemedView style={styles.statBox}>
          <ThemedText style={styles.statLabel}>Full Schema</ThemedText>
          <ThemedText style={styles.statValue}>
            {(fullSchemaSize / 1024).toFixed(1)} KB
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.statBox}>
          <ThemedText style={styles.statLabel}>Events</ThemedText>
          <ThemedText style={styles.statValue}>
            {(eventsSize / 1024).toFixed(1)} KB
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.statBox}>
          <ThemedText style={styles.statLabel}>Savings</ThemedText>
          <ThemedText style={[styles.statValue, styles.savings]}>
            {savings}%
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Mode Toggle */}
      <ThemedView style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === "full" && styles.activeButton]}
          onPress={() => setMode("full")}
        >
          <ThemedText
            style={[styles.toggleText, mode === "full" && styles.activeText]}
          >
            Full Schema
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mode === "events" && styles.activeButton,
          ]}
          onPress={() => setMode("events")}
        >
          <ThemedText
            style={[styles.toggleText, mode === "events" && styles.activeText]}
          >
            Event-Based
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Event Controls (only for event mode) */}
      {mode === "events" && (
        <ThemedView style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={addDynamicItem}
          >
            <ThemedText style={styles.controlText}>
              ➕ Add Dynamic Item
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={removeDynamicItems}
          >
            <ThemedText style={styles.controlText}>
              ➖ Remove Dynamic Items
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={updateStyle}>
            <ThemedText style={styles.controlText}>
              🎨 Update Title Style
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* Info Box */}
      <ThemedView style={styles.infoBox}>
        <ThemedText style={styles.infoTitle}>
          {mode === "full" ? "📦 Full Schema Mode" : "⚡ Event-Based Mode"}
        </ThemedText>
        <ThemedText style={styles.infoText}>
          {mode === "full"
            ? "Renders the entire document at once. Suitable for static UIs or initial loads."
            : "Renders incrementally with smooth animations. Perfect for real-time updates and collaboration."}
        </ThemedText>
      </ThemedView>

      {/* Renderer */}
      <ThemedView style={styles.rendererContainer}>
        {mode === "full" ? (
          <FullSchemaRenderer doc={sampleDoc} />
        ) : (
          <EventBasedRenderer events={events} />
        )}
      </ThemedView>

      {/* Event Log (only for event mode) */}
      {mode === "events" && (
        <ThemedView style={styles.eventLog}>
          <ThemedText style={styles.eventLogTitle}>
            Event Log ({events.length} events)
          </ThemedText>
          <ScrollView style={styles.eventLogScroll}>
            {events.slice(-10).map((event, index) => (
              <ThemedView key={index} style={styles.eventItem}>
                <ThemedText style={styles.eventType}>{event.event}</ThemedText>
                <ThemedText style={styles.eventDetails}>
                  {JSON.stringify(event, null, 2).slice(0, 100)}...
                </ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  stats: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  savings: {
    color: "#10b981",
  },
  toggle: {
    flexDirection: "row",
    margin: 16,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#3b82f6",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeText: {
    color: "#ffffff",
  },
  controls: {
    padding: 16,
    gap: 8,
  },
  controlButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  controlText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  infoBox: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.8,
  },
  rendererContainer: {
    minHeight: 400,
    margin: 16,
  },
  eventLog: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    maxHeight: 300,
  },
  eventLogTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventLogScroll: {
    maxHeight: 250,
  },
  eventItem: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  eventType: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#3b82f6",
  },
  eventDetails: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: "monospace",
  },
});
