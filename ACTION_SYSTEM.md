# Action-Based Event System

The action-based event system provides a powerful and extensible way to handle user interactions. You define a sequence of actions that execute in order when an event occurs.

## Basic Structure

```typescript
onPress: [
  {
    type: "setSharedValue",
    target: "counter",
    operation: "add",
    value: 1,
  },
  {
    type: "log",
    message: "Counter incremented!",
  },
];
```

All event handlers (`onPress`, `onPanGestureChange`, etc.) use this action array format.

## Available Actions

### 1. `setSharedValue` - Modify a shared value

```typescript
{
  type: "setSharedValue",
  target: "myValue",           // shared value ID
  operation: "set",             // "set", "add", "sub", "mul", "div"
  value: 10                     // can be: number, event param, or computed value
}
```

**Examples:**

```typescript
// Simple increment
{ type: "setSharedValue", target: "counter", operation: "add", value: 1 }

// Set from event data
{ type: "setSharedValue", target: "panX", operation: "add", value: "changeX" }

// Computed value
{
  type: "setSharedValue",
  target: "result",
  operation: "set",
  value: {
    type: "computed",
    op: "add",
    args: [
      { type: "sharedRef", ref: "a" },
      { type: "sharedRef", ref: "b" }
    ]
  }
}
```

### 2. `log` - Debug logging

```typescript
{
  type: "log",
  message: "Debug message",    // optional
  values: [                     // optional array of values to log
    "literal string",
    42,
    { type: "sharedRef", ref: "myValue" }
  ]
}
```

### 3. `conditional` - Branching logic

```typescript
{
  type: "conditional",
  condition: {
    left: { type: "sharedRef", ref: "counter" },
    op: ">",                    // ">", ">=", "<", "<=", "==", "!="
    right: 10
  },
  then: [                       // actions if true
    { type: "log", message: "Counter is high!" }
  ],
  else: [                       // actions if false (optional)
    { type: "log", message: "Counter is low" }
  ]
}
```

### 4. `animate` - Animated transitions

```typescript
{
  type: "animate",
  target: "opacity",
  to: 1,                        // target value (number, event param, or computed)
  duration: 300,                // milliseconds (optional, default 300)
  easing: "easeInOut"           // "linear", "easeIn", "easeOut", "easeInOut", "spring" (optional)
}
```

### 5. `delay` - Wait before next action

```typescript
{
  type: "delay",
  duration: 1000               // milliseconds
}
```

**Note:** Delay is partially implemented - full sequential execution with delays requires additional infrastructure.

## Complete Example

```typescript
onPress: [
  // Log current state
  {
    type: "log",
    message: "Button pressed. Current values:",
    values: [
      "counter:",
      { type: "sharedRef", ref: "counter" },
      "isActive:",
      { type: "sharedRef", ref: "isActive" },
    ],
  },

  // Increment counter
  {
    type: "setSharedValue",
    target: "counter",
    operation: "set",
    value: {
      type: "computed",
      op: "add",
      args: [{ type: "sharedRef", ref: "counter" }, 1],
    },
  },

  // Animate opacity based on counter
  {
    type: "animate",
    target: "opacity",
    to: {
      type: "computed",
      op: "clamp",
      args: [
        {
          type: "computed",
          op: "div",
          args: [{ type: "sharedRef", ref: "counter" }, 10],
        },
        0,
        1,
      ],
    },
    duration: 500,
    easing: "easeOut",
  },

  // Conditional: if counter > 5, reset it
  {
    type: "conditional",
    condition: {
      left: { type: "sharedRef", ref: "counter" },
      op: ">",
      right: 5,
    },
    then: [
      {
        type: "setSharedValue",
        target: "counter",
        operation: "set",
        value: 0,
      },
      {
        type: "log",
        message: "Counter reset!",
      },
    ],
  },
];
```

## Gesture Events

The same action system works with gesture handlers. Event parameters like `changeX`, `changeY`, `translationX`, `translationY`, `velocityX`, and `velocityY` are available as string values:

```typescript
onPanGestureChange: [
  {
    type: "setSharedValue",
    target: "panX",
    operation: "add",
    value: {
      type: "computed",
      op: "mul",
      args: [
        "changeX", // event parameter from gesture
        { type: "sharedRef", ref: "sensitivity" },
      ],
    },
  },
  {
    type: "log",
    values: ["X:", { type: "sharedRef", ref: "panX" }],
  },
];
```

## Benefits

1. **Sequential execution**: Actions run in order, enabling complex workflows
2. **Conditional logic**: Branch based on shared value states
3. **Logging**: Built-in debugging support
4. **Animations**: Declarative animated transitions
5. **Extensibility**: Easy to add new action types in the future
6. **Type safety**: Full TypeScript support with discriminated unions
