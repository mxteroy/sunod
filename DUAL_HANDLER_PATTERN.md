# Dual Handler Pattern: JS Thread + UI Thread

The Selectable node now supports **dual handlers** for every interaction event. This allows you to run logic on both the JS thread (for data operations) and the UI thread (for animations) simultaneously.

> **Note**: The `worklet` property has been **removed** from individual actions. Execution context is now determined solely by **which handler you use** (`_UI` suffix = worklet, no suffix = JS thread). This makes the API clearer and prevents confusion.

## Handler Types

Each event has two versions:

| JS Thread Handler         | UI Thread Handler            | Purpose                                         |
| ------------------------- | ---------------------------- | ----------------------------------------------- |
| `onPress`                 | `onPress_UI`                 | Tap gesture completed                           |
| `onPressIn`               | `onPressIn_UI`               | Tap gesture started                             |
| `onPressOut`              | `onPressOut_UI`              | Tap gesture ended                               |
| `onHoverIn`               | `onHoverIn_UI`               | Hover started                                   |
| `onHoverOut`              | `onHoverOut_UI`              | Hover ended                                     |
| `onSelectableStateChange` | `onSelectableStateChange_UI` | State changed (0=DEFAULT, 1=HOVERED, 2=PRESSED) |

## Execution Context

### JS Thread Handlers

- Run on the **JavaScript thread**
- Can access Zustand store and perform data operations
- Use `executeHandlerWithStore()` internally
- Support actions: `createRecord`, `updateRecord`, `deleteRecord`, `setSharedValue`
- **Best for**: Data mutations, navigation, API calls

### UI Thread Handlers (Worklets)

- Run on the **UI thread** at 60fps
- Cannot access Zustand store
- Use `executeHandler()` internally (worklet context)
- Support actions: `animate`, `setSharedValue` (direct shared value updates)
- **Best for**: Smooth animations, visual feedback, interpolations

## Usage Pattern

### Example: Interactive Button

```typescript
{
  event: "createView",
  id: "my_button",
  type: "Selectable",
  stateSharedValueId: "button_state",

  // UI Thread: Run animations at 60fps
  onSelectableStateChange_UI: [
    {
      type: "conditional",
      condition: { left: "state", op: "==", right: 2 }, // PRESSED
      then: [
        {
          type: "animate",
          target: "button_scale",
          to: 0.96,
          duration: 150,

        },
      ],
      else: [
        {
          type: "animate",
          target: "button_scale",
          to: 1.0,
          duration: 200,

        },
      ],

    },
  ],

  // JS Thread: Perform data operations
  onPress: [
    {
      type: "createRecord",
      collection: "todos",
      data: {
        title: "New Todo",
        completed: false,
      },
    },
  ],
}
```

## Benefits

### 1. **Performance Separation**

- Animations run at 60fps on UI thread without JavaScript involvement
- Data operations don't block animations
- Smooth, responsive UI even during heavy JS work

### 2. **Clear Separation of Concerns**

- Visual feedback → `_UI` handlers
- Business logic → regular handlers
- No mixing of animation and data code

### 3. **Parallel Execution**

- Both handlers can run simultaneously
- Example: Animate button press while creating a record
- UI stays responsive during async operations

### 4. **Type Safety**

- Schema enforces correct handler usage
- TypeScript catches context mismatches at compile time

## Common Patterns

### Pattern 1: Visual Feedback + Data Mutation

```typescript
{
  type: "Selectable",
  // Instant visual feedback (UI thread)
  onPress_UI: [
    { type: "animate", target: "ripple_opacity", to: 1, duration: 100 }
  ],
  // Async data operation (JS thread)
  onPress: [
    { type: "updateRecord", collection: "items", id: "item_1", data: { clicked: true } }
  ]
}
```

### Pattern 2: State-Driven Animations

```typescript
{
  type: "Selectable",
  stateSharedValueId: "button_state",
  // Animate based on interaction state (UI thread)
  onSelectableStateChange_UI: [
    // Scale, color, opacity animations based on state
  ],
  // Track clicks in store (JS thread)
  onSelectableStateChange: [
    { type: "conditional", condition: { left: "state", op: "==", right: 2 },
      then: [{ type: "setSharedValue", id: "click_count", operation: "add", value: 1 }]
    }
  ]
}
```

### Pattern 3: Hover Preview + Click Action

```typescript
{
  type: "Selectable",
  // Show preview on hover (UI thread)
  onHoverIn_UI: [
    { type: "animate", target: "preview_opacity", to: 1, duration: 200 }
  ],
  onHoverOut_UI: [
    { type: "animate", target: "preview_opacity", to: 0, duration: 200 }
  ],
  // Navigate on click (JS thread)
  onPress: [
    // Navigation or route change action
  ]
}
```

## Implementation Details

### Selectable Component

The concrete `Selectable` component handles both versions:

```tsx
<Selectable
  // JS thread handlers
  onPress={handlePress}
  onSelectableStateChange={handleStateChange}
  // UI thread handlers
  onPress_UI={handlePress_UI}
  onSelectableStateChange_UI={handleStateChange_UI}
/>
```

### Internal Execution

- **JS handlers**: Use `scheduleOnRN()` to bridge from gesture worklet to JS thread
- **UI handlers**: Execute directly in worklet context (no thread switch)

### Shared Value Updates

Both contexts can update shared values:

- **UI thread**: Direct assignment (`sharedValue.value = newValue`)
- **JS thread**: Via `setSharedValue` action (bridges to UI thread internally)

## Best Practices

1. ✅ **DO**: Use `_UI` handlers for all visual feedback
2. ✅ **DO**: Use regular handlers for data operations
3. ✅ **DO**: Keep animations smooth by running them on UI thread
4. ✅ **DO**: Use both handlers when you need immediate visual feedback + data mutation

5. ❌ **DON'T**: Put data operations in `_UI` handlers
6. ❌ **DON'T**: Put animations in regular handlers (they'll stutter)
7. ❌ **DON'T**: Try to access the store from worklet actions
8. ❌ **DON'T**: Mix worklet and non-worklet actions in the same handler

## Migration from Single Handler

### Before

```typescript
{
  type: "Selectable",
  onSelectableStateChange: [
    // All logic mixed together
    { type: "animate", target: "scale", to: 0.96 },
    { type: "createRecord", collection: "clicks", data: {...} } // ERROR!
  ]
}
```

### After

```typescript
{
  type: "Selectable",
  // Animations only (UI thread)
  onSelectableStateChange_UI: [
    { type: "animate", target: "scale", to: 0.96, duration: 150 }
  ],
  // Data operations only (JS thread)
  onPress: [
    { type: "createRecord", collection: "clicks", data: {...} }
  ]
}
```

## Summary

The dual handler pattern gives you:

- 🚀 **60fps animations** without JavaScript blocking
- 🎯 **Clear separation** between visual and business logic
- ⚡ **Parallel execution** of UI feedback and data operations
- 🛡️ **Type safety** to prevent context mixing errors

Use `_UI` suffix for smooth animations, regular handlers for everything else!
