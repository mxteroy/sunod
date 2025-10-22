// sampleDoc.ts
import type { SpaceDoc } from "@shared/schema";

export const sampleDoc: SpaceDoc = {
  id: "space-1",
  sharedValues: [
    { id: "panXToValue", t: "number", initial: 100 },
    { id: "panX", t: "number", initial: 100 },
    { id: "panY", t: "number", initial: 0 },
    { id: "progress", t: "number", initial: 0.3 }, // 0..1 slider-ish driver
    { id: "big", t: "boolean", initial: false },
    { id: "buttonPressed", t: "number", initial: 0 }, // for button animation
    { id: "multiplier", t: "number", initial: 2 }, // multiplier for nested computation
    { id: "isDragging", t: "boolean", initial: false }, // track drag state
  ],
  root: {
    type: "ThemedView",
    id: "root",
    style: {
      flex: 1,
      padding: 20,
    },
    children: [
      // Draggable container (dragging updates panX/panY via event handlers)
      {
        type: "ThemedView",
        id: "draggable",
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
          // update panXToValue to match panX + 50
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
          backgroundColor: { type: "theme", name: "surface" }, // was slate-800
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
          // Fade in more as progress passes 0.5
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
        children: [
          // Inner box that grows from 80→160 based on progress (lerp)
          {
            type: "View",
            id: "inner-lerp",
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
              backgroundColor: { type: "theme", name: "accent" }, // was cyan-400
              margin: 8,
            },
          },
          // Square that switches size via a conditional on `big`
          {
            type: "View",
            id: "conditional-square",
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
              backgroundColor: { type: "theme", name: "secondary" }, // was pink-400
              margin: 8,
              transform: {
                // Add a touch of rotation just to show string transforms coexist
                rotate: "6deg",
              },
            },
          },
          // Bar whose width is clamped: progress*300 but limited to [40, 220]
          {
            type: "View",
            id: "clamped-bar",
            style: {
              width: {
                bind: {
                  type: "expr",
                  op: "clamp",
                  args: [
                    {
                      // mul(progress, 300)
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
              backgroundColor: { type: "theme", name: "secondaryHover" }, // was emerald-400
              margin: 8,
            },
          },
        ],
      },

      // Main title
      {
        type: "Text",
        id: "main-title",
        text: "🌟 Interactive Space Demo",
        style: {
          margin: 20,
          backgroundColor: { type: "theme", name: "surfaceHover" }, // replacing rgba black overlay
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

      // Glass button that toggles the 'big' state using new action system
      {
        type: "Button",
        id: "toggle-button",
        text: "Toggle Size",
        glassEffect: true,
        onPress: [
          // Log current state
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
          // Deep nested computation:
          // buttonPressed = buttonPressed + (0.1 * multiplier)
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
                  // Nested computed value: 0.1 * multiplier
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
          // Animate panX movement
          {
            type: "animate",
            target: "panX",
            to: { type: "sharedRef", ref: "panXToValue" },
            duration: 500,
            easing: "easeInOut",
          },
          // Toggle 'big' with conditional logic
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

      // Status text that shows current state
      {
        type: "Text",
        id: "status-text",
        text: "Drag the container around!",
        style: {
          margin: 16,
          backgroundColor: { type: "theme", name: "background" }, // was slate-900 with alpha
          opacity: {
            bind: {
              type: "expr",
              op: "lerp",
              args: [0.5, 1, { type: "shared", ref: "buttonPressed" }], // opacity = 0.5 + (1 - 0.5) * buttonPressed
            },
          },
          padding: 8,
          borderRadius: 6,
        },
      },
    ],
  },
};
