# Selectable Node Example

The `Selectable` node type has been added to the schema, allowing you to create interactive elements with hover and press states.

## Features

- **State Tracking**: Automatically updates a shared value with the current SelectableState:
  - `0` = DEFAULT (not interacting)
  - `1` = HOVERED (mouse over)
  - `2` = PRESSED (actively pressing)

- **Event Handlers**: Supports the following action handlers:
  - `onPressIn`: Triggered when press starts
  - `onPressOut`: Triggered when press ends
  - `onPress`: Triggered when a successful tap/click occurs
  - `onHoverIn`: Triggered when hover starts
  - `onHoverOut`: Triggered when hover ends

## Example Usage

```typescript
import type { SpaceEvent } from "@shared/schema";

// Create a shared value to track the selectable state
const createStateValue: SpaceEvent = {
  event: "createSharedValue",
  id: "buttonState",
  type: "number",
  initial: 0, // 0 = DEFAULT
};

// Create a shared value for background opacity
const createOpacity: SpaceEvent = {
  event: "createSharedValue",
  id: "bgOpacity",
  type: "number",
  initial: 0.5,
};

// Create the selectable element
const createSelectable: SpaceEvent = {
  event: "createView",
  id: "interactive-box",
  type: "Selectable",
  stateSharedValueId: "buttonState", // Tracks 0=DEFAULT, 1=HOVERED, 2=PRESSED
  disabled: false,
  style: {
    width: 200,
    height: 100,
    backgroundColor: { type: "theme", name: "primary" },
    borderRadius: 12,
    // Bind opacity to the shared value
    opacity: {
      bind: { type: "shared", ref: "bgOpacity" },
    },
  },
  // Action handlers
  onHoverIn: [
    {
      type: "animate",
      target: "bgOpacity",
      to: 0.8,
      duration: 150,
      easing: "easeOut",
    },
    {
      type: "log",
      message: "Hover started",
    },
  ],
  onHoverOut: [
    {
      type: "animate",
      target: "bgOpacity",
      to: 0.5,
      duration: 200,
      easing: "easeIn",
    },
  ],
  onPressIn: [
    {
      type: "animate",
      target: "bgOpacity",
      to: 1.0,
      duration: 100,
    },
  ],
  onPressOut: [
    {
      type: "animate",
      target: "bgOpacity",
      to: 0.8,
      duration: 100,
    },
  ],
  onPress: [
    {
      type: "log",
      message: "Button clicked!",
      values: [{ type: "sharedRef", ref: "buttonState" }],
    },
  ],
};

// Create text inside the selectable
const createText: SpaceEvent = {
  event: "createView",
  id: "button-text",
  type: "Text",
  text: "Click Me",
  style: {
    color: { type: "theme", name: "text" },
    fontSize: 18,
  },
};

// Add text as child
const addText: SpaceEvent = {
  event: "addChild",
  parentId: "interactive-box",
  childId: "button-text",
};

// Batch all events together
const batchedEvents: SpaceEvent = {
  event: "batch",
  events: [
    createStateValue,
    createOpacity,
    createSelectable,
    createText,
    addText,
  ],
};
```

## Using State Value in Conditionals

You can use the state shared value in conditional actions to create dynamic behaviors:

```typescript
const selectableWithConditional: SpaceEvent = {
  event: "createView",
  id: "smart-button",
  type: "Selectable",
  stateSharedValueId: "buttonState",
  style: {
    width: 150,
    height: 60,
    backgroundColor: { type: "theme", name: "accent" },
  },
  onPress: [
    {
      type: "conditional",
      condition: {
        left: { type: "sharedRef", ref: "buttonState" },
        op: "==",
        right: 2, // PRESSED state
      },
      then: [
        {
          type: "log",
          message: "Button is pressed!",
        },
      ],
      else: [
        {
          type: "log",
          message: "Button is not pressed",
        },
      ],
    },
  ],
};
```

## Schema Definition

The Selectable node schema:

```typescript
export const zSelectable = z.object({
  type: z.literal("Selectable"),
  id: z.string(),
  style: zStyle.optional(),
  children: z.array(z.lazy(() => zNode)).optional(),
  stateSharedValueId: z.string().optional(), // ID of shared value for state
  onPressIn: zActionHandler.optional(),
  onPressOut: zActionHandler.optional(),
  onPress: zActionHandler.optional(),
  onHoverIn: zActionHandler.optional(),
  onHoverOut: zActionHandler.optional(),
  disabled: z.boolean().optional(),
});
```

## Benefits

1. **Performance**: State updates run on the UI thread for smooth animations
2. **Flexibility**: Combine with computed values and conditionals for complex interactions
3. **Reusable**: Can wrap any content as children
4. **Accessible**: Built on React Native Gesture Handler for cross-platform support
