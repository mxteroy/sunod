# Computed Values in Event Handlers

You can now reference other shared values in your event handlers, creating a compute graph of reactive values.

## Basic Examples

### 1. Increment a value based on itself

```typescript
onPress: {
  counter: {
    op: "set",
    value: {
      type: "computed",
      op: "add",
      args: [
        { type: "sharedRef", ref: "counter" }, // reference to current value
        1 // increment by 1
      ]
    }
  }
}
```

### 2. Toggle a boolean (stored as number: 0 or 1)

```typescript
onPress: {
  isActive: {
    op: "set",
    value: {
      type: "computed",
      op: "sub",
      args: [
        1,
        { type: "sharedRef", ref: "isActive" } // 1 - current = toggle
      ]
    }
  }
}
```

### 3. Increment by a percentage of current value

```typescript
onPress: {
  scale: {
    op: "set",
    value: {
      type: "computed",
      op: "mul",
      args: [
        { type: "sharedRef", ref: "scale" },
        1.1 // increase by 10%
      ]
    }
  }
}
```

### 4. Set value based on multiple shared values

```typescript
onPress: {
  result: {
    op: "set",
    value: {
      type: "computed",
      op: "add",
      args: [
        { type: "sharedRef", ref: "valueA" },
        { type: "sharedRef", ref: "valueB" }
      ]
    }
  }
}
```

### 5. Clamp a value within bounds

```typescript
onPress: {
  progress: {
    op: "set",
    value: {
      type: "computed",
      op: "clamp",
      args: [
        {
          type: "computed",
          op: "add",
          args: [{ type: "sharedRef", ref: "progress" }, 0.1]
        },
        0,   // min
        1    // max
      ]
    }
  }
}
```

### 6. Using event data with shared values

```typescript
onPanGestureChange: {
  combinedX: {
    op: "add",
    value: {
      type: "computed",
      op: "mul",
      args: [
        "changeX", // event parameter
        { type: "sharedRef", ref: "sensitivity" } // multiply by sensitivity factor
      ]
    }
  }
}
```

## Supported Operations

- `add`: Sum all arguments
- `sub`: Subtract subsequent arguments from the first
- `mul`: Multiply all arguments
- `div`: Divide first argument by subsequent arguments
- `clamp`: Clamp first arg between min (2nd arg) and max (3rd arg)
- `lerp`: Linear interpolation between first two args by third arg
- `min`: Minimum of all arguments
- `max`: Maximum of all arguments

## Deep Nesting Examples

The system supports **unlimited nesting depth**. Each `computed` value can contain other `computed` values as arguments.

### Example 1: Nested arithmetic

```typescript
// result = (a + b) * c
onPress: {
  result: {
    op: "set",
    value: {
      type: "computed",
      op: "mul",
      args: [
        {
          type: "computed",
          op: "add",
          args: [
            { type: "sharedRef", ref: "a" },
            { type: "sharedRef", ref: "b" }
          ]
        },
        { type: "sharedRef", ref: "c" }
      ]
    }
  }
}
```

### Example 2: Complex increment

```typescript
// counter = counter + (increment * multiplier)
onPress: {
  counter: {
    op: "set",
    value: {
      type: "computed",
      op: "add",
      args: [
        { type: "sharedRef", ref: "counter" },
        {
          type: "computed",
          op: "mul",
          args: [
            { type: "sharedRef", ref: "increment" },
            { type: "sharedRef", ref: "multiplier" }
          ]
        }
      ]
    }
  }
}
```

### Example 3: Clamped lerp

```typescript
// position = clamp(lerp(start, end, progress), 0, maxBounds)
onPress: {
  position: {
    op: "set",
    value: {
      type: "computed",
      op: "clamp",
      args: [
        {
          type: "computed",
          op: "lerp",
          args: [
            { type: "sharedRef", ref: "start" },
            { type: "sharedRef", ref: "end" },
            { type: "sharedRef", ref: "progress" }
          ]
        },
        0,
        { type: "sharedRef", ref: "maxBounds" }
      ]
    }
  }
}
```

### Example 4: Event data with nested computations

```typescript
// sensitivity = clamp(sensitivity + (changeX * 0.01), 0.5, 3)
onPanGestureChange: {
  sensitivity: {
    op: "set",
    value: {
      type: "computed",
      op: "clamp",
      args: [
        {
          type: "computed",
          op: "add",
          args: [
            { type: "sharedRef", ref: "sensitivity" },
            {
              type: "computed",
              op: "mul",
              args: ["changeX", 0.01] // event parameter * constant
            }
          ]
        },
        0.5,  // min
        3     // max
      ]
    }
  }
}
```

## Argument Types

Each `arg` in the `args` array can be:

1. **Number literal**: `5`, `0.1`, `-10`
2. **Event parameter name** (string): `"changeX"`, `"translationY"` (for gestures)
3. **Shared value reference**: `{ type: "sharedRef", ref: "mySharedValue" }`
