# Interpolate Operations Usage

The `interpolate` and `interpolateColor` operations are now implemented in the action executor (`client/core/renderer/event-based/actions.ts`).

## How They Work

Both operations are evaluated in the `evalComputedValue` function and run as **worklets on the UI thread** for maximum performance.

## Usage Examples

### 1. Basic Interpolate (Scale Animation)

Map button state (0=DEFAULT, 1=HOVERED, 2=PRESSED) to scale values:

```typescript
{
  event: "createView",
  id: "animated-button",
  type: "Selectable",
  stateSharedValueId: "buttonState",
  style: {
    transform: {
      scale: {
        bind: {
          type: "computed",
          op: "interpolate",
          args: [
            { type: "sharedRef", ref: "buttonState" }, // input: 0, 1, or 2
            [0, 1, 2], // input range: DEFAULT, HOVERED, PRESSED
            [1.0, 1.05, 0.96] // output range: scale values
          ]
        }
      }
    }
  }
}
```

### 2. Interpolate Color (Background Transition)

Smoothly transition background color based on state:

```typescript
{
  event: "createView",
  id: "color-button",
  type: "Selectable",
  stateSharedValueId: "buttonState",
  style: {
    backgroundColor: {
      bind: {
        type: "computed",
        op: "interpolateColor",
        args: [
          { type: "sharedRef", ref: "buttonState" },
          [0, 1, 2],
          [
            "#3B82F6", // DEFAULT: blue-500
            "#2563EB", // HOVERED: blue-600
            "#1D4ED8"  // PRESSED: blue-700
          ]
        ]
      }
    }
  }
}
```

### 3. Complex Multi-Property Animation

Combine multiple interpolations for rich interactions:

```typescript
{
  event: "batch",
  events: [
    {
      event: "createSharedValue",
      id: "btnState",
      type: "number",
      initial: 0
    },
    {
      event: "createView",
      id: "rich-button",
      type: "Selectable",
      stateSharedValueId: "btnState",
      style: {
        // Scale: grow on hover, shrink on press
        transform: {
          scale: {
            bind: {
              type: "computed",
              op: "interpolate",
              args: [
                { type: "sharedRef", ref: "btnState" },
                [0, 1, 2],
                [1.0, 1.02, 0.98]
              ]
            }
          }
        },
        // Opacity: subtle fade
        opacity: {
          bind: {
            type: "computed",
            op: "interpolate",
            args: [
              { type: "sharedRef", ref: "btnState" },
              [0, 1, 2],
              [1.0, 0.95, 0.9]
            ]
          }
        },
        // Background: smooth color transition
        backgroundColor: {
          bind: {
            type: "computed",
            op: "interpolateColor",
            args: [
              { type: "sharedRef", ref: "btnState" },
              [0, 1, 2],
              ["#3B82F6", "#2563EB", "#1D4ED8"]
            ]
          }
        }
      }
    }
  ]
}
```

### 4. Non-Linear Interpolation

Use custom input/output ranges for non-linear effects:

```typescript
{
  type: "computed",
  op: "interpolate",
  args: [
    { type: "sharedRef", ref: "scrollY" },
    [0, 50, 100, 200], // input breakpoints
    [0, 10, 30, 100]   // output values (accelerating curve)
  ]
}
```

## Implementation Notes

### Location

`client/core/renderer/event-based/actions.ts` in the `evalComputedValue` function

### Execution Context

Both operations run as **worklets on the UI thread** automatically:

- ✅ 60fps smooth animations
- ✅ No JS thread blocking
- ✅ Direct shared value access

### Type Safety

- `interpolate` returns a `number`
- `interpolateColor` returns a `string` (hex color)
- Both are compatible with style bindings

### Color Format Support

Currently supports:

- ✅ Hex colors: `"#3B82F6"`
- ✅ RGB: `"rgb(59, 130, 246)"`
- ✅ RGBA: `"rgba(59, 130, 246, 0.5)"`
- 🚧 Theme colors: TODO - needs theme context in worklet

### Performance

Both operations are highly optimized:

- Run on UI thread (worklet)
- No React re-renders
- Direct Reanimated interpolation
- Minimal overhead

## Comparison with Actions

### Using interpolate in bindings (Recommended)

```typescript
style: {
  opacity: {
    bind: {
      type: "computed",
      op: "interpolate",
      args: [...]
    }
  }
}
```

- ✅ Reactive - updates automatically when input changes
- ✅ Runs on every frame
- ✅ Smoothest possible animation

### Using animate action (Alternative)

```typescript
onSelectableStateChange: [
  {
    type: "animate",
    target: "opacity",
    to: 0.8,
    duration: 200,
  },
];
```

- ✅ Explicit timing control
- ✅ Custom easing
- ❌ Discrete steps, not continuous

**Best practice:** Use `interpolate` for continuous reactive animations, use `animate` for discrete state transitions.

## Common Patterns

### Button with all states

```typescript
// State: 0=DEFAULT, 1=HOVERED, 2=PRESSED
[0, 1, 2] → [defaultValue, hoveredValue, pressedValue]
```

### Progress indicator

```typescript
// Progress: 0% to 100%
[0, 100] → [0, 360] // degrees for rotation
```

### Scroll-based effects

```typescript
// Scroll position to opacity
[0, 100, 200] → [1, 0.5, 0] // fade out as you scroll
```

## Limitations

1. **Array arguments must be literal arrays** in schema (not computed)
2. **Color resolution** for theme colors not yet implemented
3. **Extrapolation** uses Reanimated defaults (extend or clamp)

## Next Steps

To fully support theme colors in interpolateColor:

1. Pass theme context to evalComputedValue
2. Resolve ColorRef objects to actual colors
3. Support both light/dark mode in interpolation
