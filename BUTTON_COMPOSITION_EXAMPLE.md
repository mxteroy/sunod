# Button Composition Example

This example shows how to build a full-featured button using only schema primitives (Selectable, View, Text) without a client-side Button component.

## Key Features Enabled

### 1. **Worklet Execution Context**
Actions now support a `worklet` flag (defaults to `true` for animations and shared value updates):
- `worklet: true` → Runs on UI thread (smooth, no JS thread blocking)
- `worklet: false` → Runs on JS thread (needed for data operations)

### 2. **onSelectableStateChange Handler**
React to any state change (DEFAULT → HOVERED → PRESSED) with a single handler:
```typescript
onSelectableStateChange: [
  {
    type: "conditional",
    condition: { left: "state", op: "==", right: 2 }, // PRESSED
    then: [{ type: "animate", target: "scale", to: 0.96 }],
    else: [{ type: "animate", target: "scale", to: 1.0 }],
    worklet: true, // Runs on UI thread
  }
]
```

### 3. **Enhanced Computed Values**
New operations for smooth animations:
- `interpolate` - Map input range to output range
- `interpolateColor` - Smooth color transitions

## Complete Button Example

```typescript
import type { SpaceEvent } from "@shared/schema";

// ============ Shared Values ============
const sharedValues: SpaceEvent[] = [
  {
    event: "createSharedValue",
    id: "buttonState",
    type: "number",
    initial: 0, // 0=DEFAULT, 1=HOVERED, 2=PRESSED
  },
  {
    event: "createSharedValue",
    id: "buttonScale",
    type: "number",
    initial: 1.0,
  },
  {
    event: "createSharedValue",
    id: "buttonOpacity",
    type: "number",
    initial: 1.0,
  },
];

// ============ Button Container (Selectable) ============
const createButton: SpaceEvent = {
  event: "createView",
  id: "custom-button",
  type: "Selectable",
  stateSharedValueId: "buttonState",
  style: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: { type: "theme", name: "primary" },
    // Bind to shared values for smooth animations
    transform: {
      scale: { bind: { type: "shared", ref: "buttonScale" } },
    },
    opacity: { bind: { type: "shared", ref: "buttonOpacity" } },
  },
  // React to state changes with smooth animations on UI thread
  onSelectableStateChange: [
    {
      type: "conditional",
      condition: {
        left: "state", // Event parameter from SelectableState
        op: "==",
        right: 2, // PRESSED
      },
      then: [
        {
          type: "animate",
          target: "buttonScale",
          to: 0.96,
          duration: 100,
          easing: "easeOut",
          worklet: true, // UI thread
        },
        {
          type: "animate",
          target: "buttonOpacity",
          to: 0.9,
          duration: 100,
          worklet: true,
        },
      ],
      else: [
        {
          type: "conditional",
          condition: {
            left: "state",
            op: "==",
            right: 1, // HOVERED
          },
          then: [
            {
              type: "animate",
              target: "buttonScale",
              to: 1.02,
              duration: 200,
              easing: "easeOut",
              worklet: true,
            },
            {
              type: "animate",
              target: "buttonOpacity",
              to: 1.0,
              duration: 200,
              worklet: true,
            },
          ],
          else: [
            // DEFAULT state
            {
              type: "animate",
              target: "buttonScale",
              to: 1.0,
              duration: 200,
              easing: "easeOut",
              worklet: true,
            },
            {
              type: "animate",
              target: "buttonOpacity",
              to: 1.0,
              duration: 200,
              worklet: true,
            },
          ],
        },
      ],
      worklet: true,
    },
  ],
  // Handle actual press event
  onPress: [
    {
      type: "log",
      message: "Button pressed!",
      worklet: false, // JS thread for console.log
    },
    {
      type: "createRecord",
      collection: "todos",
      record: { title: "New Todo", done: false },
      worklet: false, // Data operations on JS thread
    },
  ],
};

// ============ Button Content Container ============
const createButtonContent: SpaceEvent = {
  event: "createView",
  id: "button-content",
  type: "View",
  style: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};

// ============ Button Text ============
const createButtonText: SpaceEvent = {
  event: "createView",
  id: "button-text",
  type: "Text",
  text: "Click Me",
  style: {
    fontSize: 15,
    color: { type: "theme", name: "text" },
  },
};

// ============ Assembly ============
const assembleButton: SpaceEvent[] = [
  { event: "addChild", parentId: "button-content", childId: "button-text" },
  { event: "addChild", parentId: "custom-button", childId: "button-content" },
];

// ============ Complete Event Batch ============
export const buttonCompositionEvents: SpaceEvent = {
  event: "batch",
  events: [
    ...sharedValues,
    createButton,
    createButtonContent,
    createButtonText,
    ...assembleButton,
  ],
};
```

## Advanced: Ghost Button with Color Interpolation

```typescript
const ghostButtonWithInterpolation: SpaceEvent = {
  event: "createView",
  id: "ghost-button",
  type: "Selectable",
  stateSharedValueId: "ghostState",
  style: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: { type: "theme", name: "surface" },
    // Use computed value to interpolate background based on state
    backgroundColor: {
      bind: {
        type: "computed",
        op: "interpolateColor",
        args: [
          { type: "sharedRef", ref: "ghostState" }, // input (0, 1, or 2)
          [0, 1, 2], // input range (DEFAULT, HOVERED, PRESSED)
          [
            "transparent",
            { type: "theme", name: "surfaceHover" },
            { type: "theme", name: "surface" },
          ], // output colors
        ],
      },
    },
  },
  onSelectableStateChange: [
    {
      type: "log",
      message: "State changed",
      values: ["state"],
      worklet: false,
    },
  ],
};
```

## Benefits of Schema Composition

### 1. **Performance**
- ✅ All animations run on UI thread (60fps guaranteed)
- ✅ No React re-renders for state changes
- ✅ Shared values update without touching JS thread

### 2. **Flexibility**
- ✅ Compose any interaction pattern
- ✅ No client-side component needed
- ✅ Easy to customize per button instance

### 3. **Serialization**
- ✅ Entire UI defined in JSON
- ✅ Can be stored in database
- ✅ Can be edited by non-developers
- ✅ Version controlled as data

### 4. **Consistency**
- ✅ Same patterns for all components
- ✅ Predictable behavior
- ✅ Easy to reason about

## Worklet Execution Model

```typescript
// Action execution context is determined by `worklet` flag:

{
  type: "animate",
  target: "scale",
  to: 0.96,
  worklet: true, // ← UI thread (default for animations)
}

{
  type: "createRecord",
  collection: "todos",
  record: { ... },
  worklet: false, // ← JS thread (required for data operations)
}

{
  type: "conditional",
  condition: { ... },
  then: [...], // inherits parent worklet context
  else: [...],
  worklet: true, // ← Entire conditional runs on UI thread
}
```

## Migration Path

1. **Keep existing Button component** for backward compatibility
2. **Use schema composition** for new buttons in spaces
3. **Eventually deprecate** client Button component
4. **Server-driven UI** becomes possible - entire UI from database

## What's Now Possible

- ✅ Build buttons purely from schema
- ✅ Custom interaction patterns (long press, double tap, etc.)
- ✅ Complex state-driven animations
- ✅ Server-controlled UI behavior
- ✅ A/B testing interaction patterns
- ✅ User-customizable buttons
