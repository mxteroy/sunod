// Example of using the Event-Based Renderer
import type { SpaceEvent } from "@shared/schema";
import { sampleDoc } from "../sampleDoc";
import { docToEvents } from "./docToEvents";

/**
 * EXAMPLE 1: Convert existing doc to events
 */
export const sampleEvents = docToEvents(sampleDoc);

/**
 * EXAMPLE 2: SampleDoc recreated with events - Interactive draggable views with shared value interactions
 */
export const interactiveDraggableEvents: SpaceEvent[] = [
  // Step 1: Create all shared values
  {
    event: "createSharedValue",
    id: "panXToValue",
    type: "number",
    initial: 100,
  },
  { event: "createSharedValue", id: "panX", type: "number", initial: 100 },
  { event: "createSharedValue", id: "panY", type: "number", initial: 0 },
  { event: "createSharedValue", id: "progress", type: "number", initial: 0.3 },
  { event: "createSharedValue", id: "big", type: "boolean", initial: false },
  {
    event: "createSharedValue",
    id: "buttonPressed",
    type: "number",
    initial: 0,
  },
  { event: "createSharedValue", id: "multiplier", type: "number", initial: 2 },
  {
    event: "createSharedValue",
    id: "isDragging",
    type: "boolean",
    initial: false,
  },

  // New shared values for second draggable
  {
    event: "createSharedValue",
    id: "controller-panX",
    type: "number",
    initial: 100,
  },
  {
    event: "createSharedValue",
    id: "controller-panY",
    type: "number",
    initial: 250,
  },
  {
    event: "createSharedValue",
    id: "controller-isDragging",
    type: "boolean",
    initial: false,
  },

  // Step 2: Create root container
  {
    event: "createView",
    id: "root",
    type: "ThemedView",
    style: {
      flex: 1,
      padding: 20,
    },
  },
  { event: "setRoot", id: "root" },

  // Step 3: Create main draggable container
  {
    event: "createView",
    id: "draggable",
    type: "ThemedView",
    onPanGestureStart: [
      {
        type: "log",
        message: "🎯 Pan gesture started!",
      },
      {
        type: "setSharedValue",
        target: "isDragging",
        operation: "set",
        value: 1,
      },
    ],
    onPanGestureChange: [
      {
        type: "setSharedValue",
        target: "panX",
        operation: "add",
        value: "changeX",
      },
      {
        type: "setSharedValue",
        target: "panY",
        operation: "add",
        value: "changeY",
      },
    ],
    onPanGestureEnd: [
      {
        type: "log",
        message: "🏁 Pan gesture ended!",
        values: [
          "Final position - X:",
          { type: "sharedRef", ref: "panX" },
          "Y:",
          { type: "sharedRef", ref: "panY" },
        ],
      },
      {
        type: "setSharedValue",
        target: "isDragging",
        operation: "set",
        value: 0,
      },
      {
        type: "setSharedValue",
        target: "panXToValue",
        operation: "set",
        value: {
          type: "computed",
          op: "add",
          args: [{ type: "sharedRef", ref: "panX" }, 50],
        },
      },
    ],
    style: {
      width: 260,
      height: 180,
      borderRadius: 16,
      backgroundColor: { type: "theme", name: "surface" },
      transform: {
        translateX: { bind: { type: "shared", ref: "panX" } },
        translateY: { bind: { type: "shared", ref: "panY" } },
        scale: {
          bind: {
            type: "cond",
            if: {
              left: { type: "shared", ref: "isDragging" },
              op: "==",
              right: 1,
            },
            then: 1.05,
            else: 1,
          },
        },
      },
      opacity: {
        bind: {
          type: "cond",
          if: {
            left: { type: "shared", ref: "progress" },
            op: ">",
            right: 0.5,
          },
          then: 1,
          else: 0.6,
        },
      },
      padding: 12,
    },
  },
  { event: "addChild", parentId: "root", childId: "draggable" },

  // Step 4: Add inner elements to draggable
  {
    event: "createView",
    id: "inner-lerp",
    type: "View",
    style: {
      width: {
        bind: {
          type: "expr",
          op: "lerp",
          args: [80, 160, { type: "shared", ref: "progress" }],
        },
      },
      height: 16,
      borderRadius: 8,
      backgroundColor: { type: "theme", name: "accent" },
      margin: 8,
    },
  },
  { event: "addChild", parentId: "draggable", childId: "inner-lerp" },

  {
    event: "createView",
    id: "conditional-square",
    type: "View",
    style: {
      width: {
        bind: {
          type: "cond",
          if: {
            left: { type: "shared", ref: "big" },
            op: "==",
            right: 1,
          },
          then: 80,
          else: 40,
        },
      },
      height: {
        bind: {
          type: "cond",
          if: {
            left: { type: "shared", ref: "big" },
            op: "==",
            right: 1,
          },
          then: 80,
          else: 40,
        },
      },
      borderRadius: 12,
      backgroundColor: { type: "theme", name: "secondary" },
      margin: 8,
      transform: {
        rotate: "6deg",
      },
    },
  },
  { event: "addChild", parentId: "draggable", childId: "conditional-square" },

  {
    event: "createView",
    id: "clamped-bar",
    type: "View",
    style: {
      width: {
        bind: {
          type: "expr",
          op: "clamp",
          args: [
            {
              type: "expr",
              op: "mul",
              args: [{ type: "shared", ref: "progress" }, 300],
            },
            40,
            220,
          ],
        },
      },
      height: 10,
      borderRadius: 6,
      backgroundColor: { type: "theme", name: "secondaryHover" },
      margin: 8,
    },
  },
  { event: "addChild", parentId: "draggable", childId: "clamped-bar" },

  // Step 5: Create CONTROLLER draggable (second draggable that controls the first one)
  {
    event: "createView",
    id: "controller",
    type: "ThemedView",
    onPanGestureStart: [
      {
        type: "log",
        message: "🎮 Controller pan started!",
      },
      {
        type: "setSharedValue",
        target: "controller-isDragging",
        operation: "set",
        value: 1,
      },
    ],
    onPanGestureChange: [
      // Move the controller itself
      {
        type: "setSharedValue",
        target: "controller-panX",
        operation: "add",
        value: "changeX",
      },
      {
        type: "setSharedValue",
        target: "controller-panY",
        operation: "add",
        value: "changeY",
      },
      // ALSO modify the main draggable's panX!
      {
        type: "setSharedValue",
        target: "panX",
        operation: "add",
        value: {
          type: "computed",
          op: "mul",
          args: ["changeX", 0.5], // Move main draggable at half speed
        },
      },
    ],
    onPanGestureEnd: [
      {
        type: "log",
        message: "🎮 Controller released!",
        values: [
          "Controller X:",
          { type: "sharedRef", ref: "controller-panX" },
          "Main panX:",
          { type: "sharedRef", ref: "panX" },
        ],
      },
      {
        type: "setSharedValue",
        target: "controller-isDragging",
        operation: "set",
        value: 0,
      },
    ],
    style: {
      width: 140,
      height: 140,
      borderRadius: 20,
      backgroundColor: { type: "theme", name: "secondaryHover" },
      // transform: {
      //   translateX: { bind: { type: "shared", ref: "controller-panX" } },
      //   translateY: { bind: { type: "shared", ref: "controller-panY" } },
      //   scale: {
      //     bind: {
      //       type: "cond",
      //       if: {
      //         left: { type: "shared", ref: "controller-isDragging" },
      //         op: "==",
      //         right: 1,
      //       },
      //       then: 1.1,
      //       else: 1,
      //     },
      //   },
      // },
      padding: 16,
    },
  },
  { event: "addChild", parentId: "root", childId: "controller" },

  // Add label to controller
  {
    event: "createView",
    id: "controller-label",
    type: "Text",
    text: "🎮 Controller\n(Drag to move both!)",
    style: {
      fontSize: 14,
    },
  },
  { event: "addChild", parentId: "controller", childId: "controller-label" },

  // Step 6: Add title
  {
    event: "createView",
    id: "main-title",
    type: "Text",
    text: "🌟 Interactive Space Demo",
    style: {
      margin: 20,
      backgroundColor: { type: "theme", name: "surfaceHover" },
      padding: 12,
      borderRadius: 8,
      opacity: {
        bind: {
          type: "expr",
          op: "lerp",
          args: [0.6, 1, { type: "shared", ref: "progress" }],
        },
      },
    },
  },
  { event: "addChild", parentId: "root", childId: "main-title" },

  // Step 7: Add toggle button
  {
    event: "createView",
    id: "toggle-button",
    type: "Button",
    text: "Toggle Size",
    glassEffect: true,
    onPress: [
      {
        type: "log",
        message: "Button pressed! Current values:",
        values: [
          "buttonPressed:",
          { type: "sharedRef", ref: "buttonPressed" },
          "big:",
          { type: "sharedRef", ref: "big" },
        ],
      },
      {
        type: "setSharedValue",
        target: "buttonPressed",
        operation: "set",
        value: {
          type: "computed",
          op: "add",
          args: [
            { type: "sharedRef", ref: "buttonPressed" },
            {
              type: "computed",
              op: "mul",
              args: [0.1, { type: "sharedRef", ref: "multiplier" }],
            },
          ],
        },
      },
      {
        type: "setSharedValue",
        target: "panXToValue",
        operation: "set",
        value: {
          type: "computed",
          op: "add",
          args: [{ type: "sharedRef", ref: "panXToValue" }, 50],
        },
      },
      {
        type: "animate",
        target: "panX",
        to: { type: "sharedRef", ref: "panXToValue" },
        duration: 500,
        easing: "easeInOut",
      },
      {
        type: "conditional",
        condition: {
          left: { type: "sharedRef", ref: "big" },
          op: "==",
          right: 0,
        },
        then: [
          {
            type: "setSharedValue",
            target: "big",
            operation: "set",
            value: 1,
          },
          {
            type: "log",
            message: "Setting big to TRUE",
          },
        ],
        else: [
          {
            type: "setSharedValue",
            target: "big",
            operation: "set",
            value: 0,
          },
          {
            type: "log",
            message: "Setting big to FALSE",
          },
        ],
      },
    ],
    style: {
      width: 160,
      height: 50,
      borderRadius: 16,
      margin: 16,
    },
  },
  { event: "addChild", parentId: "root", childId: "toggle-button" },

  // Step 8: Add status text
  {
    event: "createView",
    id: "status-text",
    type: "Text",
    text: "Drag either view around! 🎯",
    style: {
      margin: 16,
      backgroundColor: { type: "theme", name: "background" },
      opacity: {
        bind: {
          type: "expr",
          op: "lerp",
          args: [0.5, 1, { type: "shared", ref: "buttonPressed" }],
        },
      },
      padding: 8,
      borderRadius: 6,
    },
  },
  { event: "addChild", parentId: "root", childId: "status-text" },
];

/**
 * EXAMPLE 3: Build UI incrementally with events (original simple version)
 */
export const incrementalBuildEvents: SpaceEvent[] = [
  // Step 1: Create shared values
  { event: "createSharedValue", id: "count", type: "number", initial: 0 },
  { event: "createSharedValue", id: "opacity", type: "number", initial: 1 },

  // Step 2: Create root container
  {
    event: "createView",
    id: "root",
    type: "ThemedView",
    style: {
      flex: 1,
      padding: 20,
    },
  },

  // Step 3: Set as root
  { event: "setRoot", id: "root" },

  // Step 4: Add a text element (will animate in)
  {
    event: "createView",
    id: "title",
    type: "Text",
    text: "Hello World!",
    style: {
      fontSize: 24,
      margin: 16,
      opacity: { bind: { type: "shared", ref: "opacity" } },
    },
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "title",
  },

  // Step 5: Add a button (will animate in after text)
  {
    event: "createView",
    id: "button",
    type: "Button",
    text: "Click Me",
    onPress: [
      {
        type: "setSharedValue",
        target: "count",
        operation: "add",
        value: 1,
      },
      {
        type: "log",
        message: "Count:",
        values: [{ type: "sharedRef", ref: "count" }],
      },
    ],
    style: {
      margin: 16,
    },
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "button",
  },
];

/**
 * EXAMPLE 3: Simulated real-time updates
 * These could come from a WebSocket, GraphQL subscription, etc.
 */
export function simulateRealTimeUpdates(
  onEvent: (event: SpaceEvent) => void
): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  // Add a new item after 1 second
  timeouts.push(
    setTimeout(() => {
      onEvent({
        event: "createView",
        id: "dynamic-item-1",
        type: "Text",
        text: "✨ Dynamically added!",
        style: { margin: 8 },
      });
      onEvent({
        event: "addChild",
        parentId: "root",
        childId: "dynamic-item-1",
      });
    }, 2000)
  );

  // Update text after 2 seconds
  timeouts.push(
    setTimeout(() => {
      onEvent({
        event: "updateText",
        id: "dynamic-item-1",
        text: "🎉 Text updated!",
      });
    }, 2000)
  );

  // Update style after 3 seconds
  timeouts.push(
    setTimeout(() => {
      onEvent({
        event: "updateStyle",
        id: "dynamic-item-1",
        style: { backgroundColor: { type: "theme", name: "accent" } },
        merge: true,
        animated: true,
        duration: 500,
      });
    }, 3000)
  );

  // Remove item after 5 seconds
  timeouts.push(
    setTimeout(() => {
      onEvent({
        event: "removeChild",
        parentId: "root",
        childId: "dynamic-item-1",
      });
      onEvent({
        event: "deleteNode",
        id: "dynamic-item-1",
        animated: true,
        duration: 300,
      });
    }, 5000)
  );

  // Cleanup function
  return () => {
    timeouts.forEach(clearTimeout);
  };
}

/**
 * EXAMPLE 4: Batch events for efficient network transmission
 */
export const batchedEvents: SpaceEvent = {
  event: "batch",
  events: [
    { event: "createSharedValue", id: "x", type: "number", initial: 0 },
    { event: "createSharedValue", id: "y", type: "number", initial: 0 },
    {
      event: "createView",
      id: "container",
      type: "View",
      style: {
        width: 100,
        height: 100,
        transform: {
          translateX: { bind: { type: "shared", ref: "x" } },
          translateY: { bind: { type: "shared", ref: "y" } },
        },
      },
    },
  ],
};

/**
 * EXAMPLE 5: Progressive UI building
 * Build a complex UI in layers for smooth rendering
 */
export function getProgressiveUIEvents(): SpaceEvent[][] {
  return [
    // Layer 1: Foundation (immediate)
    [
      { event: "createSharedValue", id: "scroll", type: "number", initial: 0 },
      {
        event: "createView",
        id: "app-root",
        type: "ThemedView",
        style: { flex: 1 },
      },
      { event: "setRoot", id: "app-root" },
    ],

    // Layer 2: Main structure (render after 16ms)
    [
      {
        event: "createView",
        id: "header",
        type: "ThemedView",
        style: { height: 60, padding: 16 },
      },
      { event: "addChild", parentId: "app-root", childId: "header" },
      {
        event: "createView",
        id: "content",
        type: "ThemedView",
        style: { flex: 1 },
      },
      { event: "addChild", parentId: "app-root", childId: "content" },
    ],

    // Layer 3: Header content (render after 32ms)
    [
      {
        event: "createView",
        id: "title",
        type: "Text",
        text: "My App",
        style: { fontSize: 20 },
      },
      { event: "addChild", parentId: "header", childId: "title" },
    ],

    // Layer 4: Main content (render after 48ms)
    [
      {
        event: "createView",
        id: "item-1",
        type: "Text",
        text: "Item 1",
        style: { margin: 8 },
      },
      { event: "addChild", parentId: "content", childId: "item-1" },
      {
        event: "createView",
        id: "item-2",
        type: "Text",
        text: "Item 2",
        style: { margin: 8 },
      },
      { event: "addChild", parentId: "content", childId: "item-2" },
    ],
  ];
}
