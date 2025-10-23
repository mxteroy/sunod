# Event-Based Renderer - Modular Architecture

## Overview

The EventBasedRenderer has been refactored into a modular architecture for better maintainability, testability, and code organization. Each component has a single, well-defined responsibility.

## Directory Structure

```
event-based/
├── index.tsx              # Main EventBasedRenderer component (entry point)
├── types.ts               # TypeScript interfaces and types
├── actions.ts             # Action execution (worklet & non-worklet)
├── templateBinding.ts     # Template string resolution ({{var.field}})
├── eventProcessor.ts      # Event handling and node tree mutations
├── RenderNode.tsx         # Node type router (memoized)
├── RenderViewNode.tsx     # View/ThemedView renderer with gestures
├── RenderTextNode.tsx     # Text renderer with template binding
├── RenderButtonNode.tsx   # Button renderer with action support
├── RenderForNode.tsx      # List renderer (FlashList + collections)
└── README.md             # This file
```

## File Responsibilities

### `index.tsx` - Main Renderer

**Purpose**: Entry point and orchestration

- Manages node tree state (`Map<string, NodeState>`)
- Manages shared values (Reanimated)
- Creates/provides Zustand store
- Processes events incrementally
- Renders root node

**Key Exports**: `EventBasedRenderer` (default)

### `types.ts` - Type Definitions

**Purpose**: Centralized type definitions

- `NodeState`: Internal representation of UI nodes
- `RenderNodeProps`: Props for all render components
- `EventBasedRendererProps`: Main renderer props

**Key Exports**: All types

### `actions.ts` - Action Execution

**Purpose**: Execute actions from event handlers

- `evalComputedValue()`: Evaluates computed values and math expressions (worklet)
- `executeAction()`: Single action execution (worklet)
- `executeHandler()`: Array of actions (worklet)
- `executeHandlerWithStore()`: Non-worklet version for data actions

**Worklet vs Non-Worklet**:

- Worklet: `setSharedValue`, `animate`, `log`, `conditional`
- Non-Worklet: `createRecord`, `updateRecord`, `deleteRecord`

**Key Exports**: All action functions

### `templateBinding.ts` - Data Binding

**Purpose**: Resolve template strings to actual values

- `resolveTemplateString()`: Converts `{{itemVar.field}}` to actual value

**Example**:

```typescript
resolveTemplateString(
  "{{todo.title}}",
  { id: 1, title: "Buy milk", done: false },
  "todo"
);
// Returns: "Buy milk"
```

**Key Exports**: `resolveTemplateString()`

### `eventProcessor.ts` - Event Processing

**Purpose**: Handle SpaceEvent mutations

- `createEventProcessor()`: Factory that returns event processor function
- Handles: `createView`, `addChild`, `removeChild`, `updateStyle`, `updateText`, `deleteNode`, `setRoot`, `batch`
- Updates node tree state immutably
- Manages shared values

**Key Exports**: `createEventProcessor()`

### `RenderNode.tsx` - Node Router

**Purpose**: Dispatch to appropriate renderer based on node type

- Memoized to prevent unnecessary re-renders
- Custom equality check (only re-render if node reference changes)
- Routes to: View, Text, Button, or For renderers

**Key Exports**: `RenderNode` (memoized component)

### `RenderViewNode.tsx` - View Renderer

**Purpose**: Render View and ThemedView nodes

- Gesture support (pan, tap)
- Children rendering (IDs or inline objects)
- Context propagation for template binding
- Layout animations (slide in/out)

**Features**:

- Handles both regular children (IDs) and template children (objects)
- Passes `itemContext` and `itemVar` to all children
- Skips animations for root node (iOS compatibility)

**Key Exports**: `RenderViewNode()`

### `RenderTextNode.tsx` - Text Renderer

**Purpose**: Render Text nodes with data binding

- Template string resolution via `resolveTemplateString()`
- Themed text support
- Layout animations

**Example**:

```typescript
// node.text = "{{todo.title}}"
// itemContext = { id: 1, title: "Buy milk" }
// itemVar = "todo"
// → Renders: "Buy milk"
```

**Key Exports**: `RenderTextNode()`

### `RenderButtonNode.tsx` - Button Renderer

**Purpose**: Render Button nodes with actions

- Template string resolution for button text
- Action execution via `executeHandlerWithStore()`
- Supports data actions (create/update/delete records)
- Layout animations

**Key Exports**: `RenderButtonNode()`

### `RenderForNode.tsx` - List Renderer

**Purpose**: Render lists from collections

- Reads from Zustand collections
- FlashList for performance
- Sorting and limits
- Horizontal/vertical layouts
- Template rendering per item
- Context binding for each item

**Data Flow**:

1. Read collection from store: `store.collections[key]`
2. Convert to array: `Object.values(collection)`
3. Apply sorting: `orderBy` field
4. Apply limit: slice array
5. Render template for each item with context

**Key Exports**: `RenderForNode()`

## Usage

### Basic Import

```typescript
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
// or
import { EventBasedRenderer } from "@/core/renderer/event-based";
```

### With Store

```typescript
import { useSpaceStore } from "@/core/store";
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";

function MyComponent() {
  const store = useSpaceStore("my-space", collectionDefs);

  return (
    <EventBasedRenderer
      events={events}
      spaceId="my-space"
      store={store}
    />
  );
}
```

### Template Binding Example

```typescript
// Event
{
  event: "createView",
  type: "For",
  from: { type: "collection", key: "todos" },
  as: "todo",
  template: {
    type: "View",
    children: [
      {
        type: "Text",
        text: "{{todo.title}}"  // ← Bound to item.title
      }
    ]
  }
}

// Store data
store.createRecord("todos", {
  id: "1",
  title: "Buy milk",
  done: false
});

// Result: Text renders "Buy milk"
```

## Architecture Benefits

### 1. **Separation of Concerns**

Each file has a single, clear responsibility

### 2. **Testability**

Pure functions can be tested in isolation

- `resolveTemplateString()` - unit test with mock data
- `executeAction()` - unit test with mock shared values
- `createEventProcessor()` - unit test with mock setState

### 3. **Maintainability**

Easy to find and modify specific functionality

- Bug in template binding? → `templateBinding.ts`
- Bug in gesture handling? → `RenderViewNode.tsx`
- Bug in event processing? → `eventProcessor.ts`

### 4. **Tree-Shaking**

Import only what you need:

```typescript
import { resolveTemplateString } from "@/core/renderer/event-based/templateBinding";
```

### 5. **Type Safety**

Centralized types in `types.ts` ensure consistency

### 6. **Code Reuse**

- `resolveTemplateString()` used by Text, Button, and potentially more
- `executeHandlerWithStore()` used by Button and other action handlers
- `RenderNode` used recursively by all renderers

## Migration Guide

### Old Import

```typescript
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
```

### New Import (Still Works)

```typescript
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
// This file now re-exports from event-based/index.tsx
```

### Direct Import (Recommended)

```typescript
import EventBasedRenderer from "@/core/renderer/event-based";
```

### Importing Specific Parts

```typescript
import { resolveTemplateString } from "@/core/renderer/event-based/templateBinding";
import { executeHandlerWithStore } from "@/core/renderer/event-based/actions";
import type { NodeState } from "@/core/renderer/event-based/types";
```

## Future Enhancements

### Potential Additions

1. **RenderImageNode.tsx** - Image component with lazy loading
2. **RenderInputNode.tsx** - Text input with two-way binding
3. **RenderConditionalNode.tsx** - If/else rendering
4. **renderHooks.ts** - Custom hooks for render components
5. **animations.ts** - Reusable animation configurations
6. **gestures.ts** - Reusable gesture configurations

### Testing Strategy

```
event-based/
├── __tests__/
│   ├── templateBinding.test.ts
│   ├── actions.test.ts
│   ├── eventProcessor.test.ts
│   └── integration.test.tsx
```

## Performance Considerations

### Memoization Strategy

- `RenderNode`: Memoized with custom equality check
- `RenderForNode.renderItem`: useCallback with stable deps
- `RenderForNode.collection`: Select stable object reference, not array
- `resolveTemplateString`: Called in useMemo in render components

### Optimization Tips

1. Keep event processing lightweight
2. Use `useCallback` for stable function references
3. Zustand selectors should be memoized
4. FlashList for large lists (already used)
5. Skip animations for root node (already done)

## Debugging

### Enable Logging

Each render component has console.log statements that can be enabled:

```typescript
// RenderTextNode.tsx
console.log("resolvedText", resolvedText);

// RenderForNode.tsx
console.log("final items size", sortedItems.length);

// eventProcessor.ts
console.log("Processing event:", event.event, event);
```

### Common Issues

1. **"For node missing template"** → Check template is set in createView event
2. **"For node requires store prop"** → Pass store to EventBasedRenderer
3. **Template not binding** → Check itemContext and itemVar are passed through component tree
4. **Infinite re-renders** → Check Zustand selector is memoized, returns stable reference

## Contributing

### Adding a New Node Type

1. Create `RenderMyNode.tsx` in `event-based/`
2. Add type to `NodeState` in `types.ts`
3. Add case to switch in `RenderNode.tsx`
4. Handle in `eventProcessor.ts` if needed

### Adding a New Action Type

1. Add handler in `executeAction()` in `actions.ts`
2. Document whether it runs in worklet or not
3. Update `executeHandlerWithStore()` if it needs store access

## License

Same as parent project
