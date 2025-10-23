import type { SpaceEvent } from "@shared/schema";

/**
 * Interactive draggable demo - showcases event-based rendering with gestures
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
          args: ["changeX", 1], // Move main draggable at half speed
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
