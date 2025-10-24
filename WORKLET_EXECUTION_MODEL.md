# Worklet Execution Model - Action System

## Overview

The action system has two execution contexts:

1. **UI Thread (Worklet)** - For animations and visual feedback (60fps)
2. **JS Thread** - For data operations and business logic

## Execution Context by Handler

| Handler                   | Context                 | Use Case                    | Can Access                |
| ------------------------- | ----------------------- | --------------------------- | ------------------------- |
| `onSelectableStateChange` | **UI Thread (Worklet)** | Visual feedback, animations | Shared values, animations |
| `onHoverIn`               | **UI Thread (Worklet)** | Hover effects               | Shared values, animations |
| `onHoverOut`              | **UI Thread (Worklet)** | Hover effects               | Shared values, animations |
| `onPressIn`               | **JS Thread**           | Pre-press logic             | Store, data operations    |
| `onPressOut`              | **JS Thread**           | Post-press logic            | Store, data operations    |
| `onPress`                 | **JS Thread**           | Main action                 | Store, data operations    |
| `onPanGestureStart`       | **UI Thread (Worklet)** | Gesture feedback            | Shared values, animations |
| `onPanGestureChange`      | **UI Thread (Worklet)** | Gesture tracking            | Shared values, animations |
| `onPanGestureEnd`         | **UI Thread (Worklet)** | Gesture finish              | Shared values, animations |

## Actions by Execution Context

### ✅ UI Thread (Worklet) - Safe Actions

These actions work in `onSelectableStateChange`, `onHoverIn`, `onHoverOut`, gesture handlers:

```typescript
// ✅ Animate - Smooth 60fps animations
{
  type: "animate",
  target: "buttonScale",
  to: 0.96,
  duration: 200,
  easing: "easeOut",
  worklet: true // default
}

// ✅ SetSharedValue - Direct shared value updates
{
  type: "setSharedValue",
  target: "opacity",
  operation: "set",
  value: 0.8,
  worklet: true // default
}

// ✅ Conditional - Branching logic
{
  type: "conditional",
  condition: { left: "state", op: "==", right: 2 },
  then: [/* more worklet actions */],
  else: [/* more worklet actions */],
  worklet: true // default
}

// ✅ Log - Console output (slower but works)
{
  type: "log",
  message: "State changed",
  values: [{ type: "sharedRef", ref: "buttonState" }]
}
```

### ❌ JS Thread Only - Data Operations

These actions **ONLY** work in `onPress`, `onPressIn`, `onPressOut`:

```typescript
// ❌ WRONG - Will not work in onSelectableStateChange
{
  type: "onSelectableStateChange",
  actions: [
    {
      type: "createRecord", // ❌ Error! Cannot run in worklet
      collection: "todos",
      record: { title: "New Todo" }
    }
  ]
}

// ✅ CORRECT - Use in onPress instead
{
  type: "onPress",
  actions: [
    {
      type: "createRecord", // ✅ Works! Runs on JS thread
      collection: "todos",
      record: { title: "New Todo" },
      worklet: false
    }
  ]
}
```

## Common Patterns

### Pattern 1: Visual Feedback + Data Operation

**Use Case:** Button that animates on press and creates a record

```typescript
{
  event: "createView",
  type: "Selectable",

  // Visual feedback (UI thread)
  onSelectableStateChange: [
    {
      type: "conditional",
      condition: { left: "state", op: "==", right: 2 }, // PRESSED
      then: [
        { type: "animate", target: "scale", to: 0.96, duration: 100 }
      ],
      else: [
        { type: "animate", target: "scale", to: 1.0, duration: 200 }
      ]
    }
  ],

  // Data operation (JS thread)
  onPress: [
    {
      type: "createRecord",
      collection: "todos",
      record: { title: "New Todo" }
    }
  ]
}
```

### Pattern 2: Hover Effects

**Use Case:** Button that changes color on hover

```typescript
{
  event: "createView",
  type: "Selectable",

  // Option A: Use onSelectableStateChange (recommended)
  onSelectableStateChange: [
    {
      type: "conditional",
      condition: { left: "state", op: "==", right: 1 }, // HOVERED
      then: [
        { type: "animate", target: "bgOpacity", to: 0.8, duration: 150 }
      ],
      else: [
        { type: "animate", target: "bgOpacity", to: 1.0, duration: 200 }
      ]
    }
  ],

  // Option B: Use separate hover handlers (more verbose)
  onHoverIn: [
    { type: "animate", target: "bgOpacity", to: 0.8, duration: 150 }
  ],
  onHoverOut: [
    { type: "animate", target: "bgOpacity", to: 1.0, duration: 200 }
  ]
}
```

### Pattern 3: Complex State Machine

**Use Case:** Button with different animations for each state

```typescript
{
  event: "createView",
  type: "Selectable",
  stateSharedValueId: "btnState",

  onSelectableStateChange: [
    {
      type: "conditional",
      condition: { left: "state", op: "==", right: 2 }, // PRESSED
      then: [
        { type: "animate", target: "scale", to: 0.96, duration: 100 },
        { type: "animate", target: "opacity", to: 0.9, duration: 100 },
        { type: "setSharedValue", target: "pressCount", operation: "add", value: 1 }
      ],
      else: [
        {
          type: "conditional",
          condition: { left: "state", op: "==", right: 1 }, // HOVERED
          then: [
            { type: "animate", target: "scale", to: 1.02, duration: 200 },
            { type: "animate", target: "opacity", to: 1.0, duration: 200 }
          ],
          else: [ // DEFAULT
            { type: "animate", target: "scale", to: 1.0, duration: 200 },
            { type: "animate", target: "opacity", to: 1.0, duration: 200 }
          ]
        }
      ]
    }
  ]
}
```

## Limitations & Workarounds

### Limitation 1: No Data Operations in Worklets

**Problem:**

```typescript
// ❌ This will NOT work
onSelectableStateChange: [
  {
    type: "conditional",
    condition: { left: "state", op: "==", right: 2 },
    then: [
      { type: "createRecord", collection: "todos", ... } // ❌ Error!
    ]
  }
]
```

**Solution:**
Use a shared value to track the state, then check it in onPress:

```typescript
// Track state in shared value
onSelectableStateChange: [
  {
    type: "setSharedValue",
    target: "shouldCreate",
    operation: "set",
    value: 1
  }
]

// Check state and perform data operation
onPress: [
  {
    type: "conditional",
    condition: {
      left: { type: "sharedRef", ref: "shouldCreate" },
      op: "==",
      right: 1
    },
    then: [
      { type: "createRecord", collection: "todos", ... }
    ]
  }
]
```

### Limitation 2: Can't Mix Worklet and JS Actions in Same Conditional

**Problem:**

```typescript
// ❌ This is problematic
{
  type: "conditional",
  worklet: true, // Runs in worklet
  then: [
    { type: "animate", ... }, // ✅ Works (worklet)
    { type: "createRecord", ... } // ❌ Won't work (needs JS thread)
  ]
}
```

**Solution:**
Separate concerns - animations in worklet handlers, data in JS handlers.

## Best Practices

### ✅ DO

1. **Use `onSelectableStateChange` for all visual feedback**
   - Scale, opacity, color animations
   - State-dependent visual changes
2. **Use `onPress` for all data operations**
   - Creating/updating/deleting records
   - API calls
   - Navigation

3. **Keep animations fast**
   - Short durations (100-300ms)
   - Use appropriate easing

4. **Use conditional logic in worklets**
   - Branch on state values
   - Complex state machines work great

### ❌ DON'T

1. **Don't put data operations in worklet handlers**
   - onSelectableStateChange
   - onHoverIn/onHoverOut
   - Gesture handlers

2. **Don't use heavy computations in worklets**
   - Keep worklets fast
   - Complex logic can drop frames

3. **Don't mix worklet and JS actions**
   - Separate concerns
   - Use appropriate handler for each action type

## Error Messages

When you see these errors, you've mixed contexts:

```
❌ Data action createRecord called in worklet context!
Data operations must use executeHandlerWithStore (e.g., in onPress handlers).
onSelectableStateChange/onHoverIn/onHoverOut run in worklets and cannot perform data operations.
```

**Fix:** Move the data operation from the worklet handler (e.g., `onSelectableStateChange`) to a JS handler (e.g., `onPress`).

## Summary

| Need             | Use Handler                                  | Context                 |
| ---------------- | -------------------------------------------- | ----------------------- |
| Visual feedback  | `onSelectableStateChange`                    | UI Thread (Worklet)     |
| Hover effects    | `onSelectableStateChange` or `onHoverIn/Out` | UI Thread (Worklet)     |
| Gesture tracking | `onPanGestureChange`                         | UI Thread (Worklet)     |
| Data operations  | `onPress`                                    | JS Thread               |
| Business logic   | `onPress`                                    | JS Thread               |
| Mixed            | Both handlers                                | Use both, keep separate |

**Golden Rule:** Animations and visual feedback in worklets, data and business logic in JS thread handlers. 🎨⚡️
