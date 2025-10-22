import type {
  ButtonNode,
  SpaceDoc,
  SpaceEvent,
  TextNode,
  ThemedViewNode,
  ViewNode,
} from "@shared/schema";

/**
 * Convert a full SpaceDoc to an array of incremental events
 * This allows you to transition from the old full-doc approach to event-based
 */
export function docToEvents(doc: SpaceDoc): SpaceEvent[] {
  const events: SpaceEvent[] = [];

  // 1. Create all shared values
  for (const sv of doc.sharedValues) {
    events.push({
      event: "createSharedValue",
      id: sv.id,
      type: sv.t,
      initial: sv.initial,
    });
  }

  // 2. Recursively create views and their children
  function processNode(
    node: ViewNode | ThemedViewNode | TextNode | ButtonNode,
    parentId?: string
  ) {
    // Create the node
    const createEvent: SpaceEvent = {
      event: "createView",
      id: node.id,
      type: node.type,
      style: node.style,
      text: "text" in node ? node.text : undefined,
      glassEffect: "glassEffect" in node ? node.glassEffect : undefined,
      props: "props" in node ? node.props : undefined,
      onPanGestureStart:
        "onPanGestureStart" in node ? node.onPanGestureStart : undefined,
      onPanGestureChange:
        "onPanGestureChange" in node ? node.onPanGestureChange : undefined,
      onPanGestureEnd:
        "onPanGestureEnd" in node ? node.onPanGestureEnd : undefined,
      onPress: "onPress" in node ? node.onPress : undefined,
    };
    events.push(createEvent);

    // If this has a parent, add it as a child
    if (parentId) {
      events.push({
        event: "addChild",
        parentId,
        childId: node.id,
      });
    }

    // Process children if they exist
    if ("children" in node && node.children) {
      for (const child of node.children) {
        processNode(child as any, node.id);
      }
    }
  }

  // Process the root node
  processNode(doc.root);

  // 3. Set the root
  events.push({
    event: "setRoot",
    id: doc.root.id,
  });

  return events;
}

/**
 * Create a batch event for efficient transmission
 */
export function batchEvents(events: SpaceEvent[]): SpaceEvent {
  // Filter out nested batch events and other events that can't be in a batch
  const batchableEvents = events.filter((e) => e.event !== "batch");

  return {
    event: "batch",
    events: batchableEvents as any,
  };
}

/**
 * Example: Create events for adding a single view incrementally
 */
export function createViewEvents(
  id: string,
  type: "View" | "ThemedView" | "Text" | "Button",
  parentId: string,
  options: {
    style?: any;
    text?: string;
    index?: number;
  } = {}
): SpaceEvent[] {
  return [
    {
      event: "createView",
      id,
      type,
      style: options.style,
      text: options.text,
    },
    {
      event: "addChild",
      parentId,
      childId: id,
      index: options.index,
    },
  ];
}

/**
 * Example: Create events for removing a view
 */
export function deleteViewEvents(
  id: string,
  parentId: string,
  animated: boolean = true
): SpaceEvent[] {
  return [
    {
      event: "removeChild",
      parentId,
      childId: id,
    },
    {
      event: "deleteNode",
      id,
      animated,
      duration: animated ? 200 : undefined,
    },
  ];
}
