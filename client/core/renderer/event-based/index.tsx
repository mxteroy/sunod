import { useEffect, useRef, useState } from "react";
import { AudioAppContext } from "../../audio/AudioAppContext";
import { getAudioManager } from "../../audio/AudioManager";
import { startSoundQueueProcessor } from "../../audio/WorkletAudioBridge";
import { useSpaceStore } from "../../store";
import type { SVMap } from "../FullSchemaRenderer";
import { createEventProcessor } from "./eventProcessor";
import { RenderNode } from "./RenderNode";
import type { EventBasedRendererProps, NodeState } from "./types";

/**
 * Event-Based Incremental Renderer
 *
 * Processes events one by one to build up the UI incrementally
 * - Supports smooth layout animations when adding/removing nodes
 * - Much smaller payload than full schema updates
 * - Enables real-time collaborative editing
 * - Integrates with Zustand for collection/data management
 *
 * @example
 * ```tsx
 * <EventBasedRenderer
 *   events={spaceEvents}
 *   spaceId="my-space"
 * />
 * ```
 */
export default function EventBasedRenderer({
  events = [],
  spaceId = "default",
  store: externalStore,
}: EventBasedRendererProps) {
  const [nodes, setNodes] = useState<Map<string, NodeState>>(new Map());
  const [rootId, setRootId] = useState<string | null>(null);
  const sharedValuesRef = useRef<SVMap>({});

  // Create store internally if not provided
  const internalStore = useSpaceStore(spaceId);
  const store = externalStore || internalStore;

  console.log("EventBasedRenderer render - received events:", events?.length);

  // Track how many events we've processed to avoid reprocessing
  const processedCountRef = useRef(0);

  // Start sound queue processor for worklet-based audio triggers
  useEffect(() => {
    console.log("Starting sound queue processor");
    const cleanup = startSoundQueueProcessor();
    return cleanup;
  }, []);

  // Cleanup audio resources for this app when unmounting
  useEffect(() => {
    console.log(`🎵 EventBasedRenderer mounted for app: ${spaceId}`);

    return () => {
      console.log(
        `🧹 EventBasedRenderer unmounting - cleaning up audio for: ${spaceId}`
      );
      const audioManager = getAudioManager();
      audioManager.cleanupApp(spaceId);
    };
  }, [spaceId]);

  // Process only NEW events incrementally
  useEffect(() => {
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }

    // Only process events we haven't seen yet
    const newEvents = events.slice(processedCountRef.current);
    if (newEvents.length === 0) return;

    console.log("Processing", newEvents.length, "new events");
    const processEvent = createEventProcessor(
      setNodes,
      setRootId,
      sharedValuesRef
    );
    newEvents.forEach(processEvent);
    processedCountRef.current = events.length;
  }, [events]);

  // Safety check
  if (!Array.isArray(events)) {
    console.error("EventBasedRenderer: events is not an array", events);
    return null;
  }

  // Render root node
  if (!rootId) {
    console.log("No root ID set yet");
    return null;
  }

  const rootNode = nodes.get(rootId);
  if (!rootNode) {
    console.log("Root node not found:", rootId);
    return null;
  }

  return (
    <AudioAppContext.Provider value={spaceId}>
      <RenderNode
        node={rootNode}
        nodes={nodes}
        map={sharedValuesRef.current}
        isRoot={true}
        store={store}
      />
    </AudioAppContext.Provider>
  );
}
