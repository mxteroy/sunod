# Event-Based Incremental Renderer

## Overview

The Event-Based Renderer is a more efficient alternative to sending full schema documents. Instead of transmitting the entire UI structure, you send granular events that incrementally build and modify the UI.

## Benefits

### 1. **Smaller Payload Size**
- Only send what changed, not the entire document
- Typical event: 100-500 bytes vs full schema: 10-100 KB
- 10-100x reduction in data transfer

### 2. **Smooth Layout Animations**
- Reanimated's `Layout` transitions automatically animate node additions/removals
- `FadeIn`/`FadeOut` animations for smooth appearance
- Progressive rendering reduces jank

### 3. **Real-Time Collaboration**
- Stream events from WebSocket/GraphQL subscriptions
- Multiple users can edit the same space
- Conflict resolution at the event level

### 4. **Progressive Rendering**
- Render critical UI first (root, headers)
- Load secondary content incrementally
- Better perceived performance

### 5. **Optimistic Updates**
- Apply events immediately on the client
- Rollback if server rejects
- Snappy user experience

## Event Types

### Shared Value Events

```typescript
// Create a new shared value
{
  event: "createSharedValue",
  id: "panX",
  type: "number",
  initial: 0
}

// Update a shared value (optionally animated)
{
  event: "updateSharedValue",
  id: "panX",
  value: 100,
  animated: true,
  duration: 300
}
```

### Node Creation & Management

```typescript
// Create a view node
{
  event: "createView",
  id: "my-view",
  type: "ThemedView",
  style: { padding: 20 },
  onPress: [...]  // optional event handlers
}

// Add as child to parent
{
  event: "addChild",
  parentId: "root",
  childId: "my-view",
  index: 0  // optional position
}

// Remove child
{
  event: "removeChild",
  parentId: "root",
  childId: "my-view"
}

// Delete node completely
{
  event: "deleteNode",
  id: "my-view",
  animated: true,  // fade out before removal
  duration: 200
}
```

### Style & Content Updates

```typescript
// Update style (merge or replace)
{
  event: "updateStyle",
  id: "my-view",
  style: { backgroundColor: "#ff0000" },
  merge: true,  // merge with existing style
  animated: true,
  duration: 300
}

// Update text content
{
  event: "updateText",
  id: "my-text",
  text: "New text content"
}
```

### Root & Batching

```typescript
// Set the root view
{
  event: "setRoot",
  id: "app-root"
}

// Batch multiple events
{
  event: "batch",
  events: [
    { event: "createView", ... },
    { event: "addChild", ... },
    ...
  ]
}
```

## Usage Examples

### Example 1: Basic Usage

```tsx
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import { sampleEvents } from "@/core/renderer/eventExamples";

function MyApp() {
  return <EventBasedRenderer events={sampleEvents} />;
}
```

### Example 2: Dynamic Updates

```tsx
import { useState } from "react";
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import type { SpaceEvent } from "@shared/schema";

function DynamicApp() {
  const [events, setEvents] = useState<SpaceEvent[]>([
    { event: "createView", id: "root", type: "ThemedView", style: { flex: 1 } },
    { event: "setRoot", id: "root" },
  ]);

  const addItem = () => {
    const newId = `item-${Date.now()}`;
    setEvents([
      ...events,
      {
        event: "createView",
        id: newId,
        type: "Text",
        text: "New item!",
        style: { margin: 8 },
      },
      {
        event: "addChild",
        parentId: "root",
        childId: newId,
      },
    ]);
  };

  return (
    <>
      <EventBasedRenderer events={events} />
      <button onClick={addItem}>Add Item</button>
    </>
  );
}
```

### Example 3: Progressive Loading

```tsx
import { useState, useEffect } from "react";
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import { getProgressiveUIEvents } from "@/core/renderer/eventExamples";

function ProgressiveApp() {
  const [events, setEvents] = useState<SpaceEvent[]>([]);

  useEffect(() => {
    const layers = getProgressiveUIEvents();
    
    // Render each layer progressively
    layers.forEach((layer, index) => {
      setTimeout(() => {
        setEvents(prev => [...prev, ...layer]);
      }, index * 16); // 16ms per layer (one frame)
    });
  }, []);

  return <EventBasedRenderer events={events} />;
}
```

### Example 4: Real-Time Collaboration

```tsx
import { useState, useEffect } from "react";
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import type { SpaceEvent } from "@shared/schema";

function CollaborativeApp({ spaceId }: { spaceId: string }) {
  const [events, setEvents] = useState<SpaceEvent[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(`wss://api.example.com/spaces/${spaceId}`);
    
    ws.onmessage = (msg) => {
      const event: SpaceEvent = JSON.parse(msg.data);
      setEvents(prev => [...prev, event]);
    };

    return () => ws.close();
  }, [spaceId]);

  const handleLocalChange = (event: SpaceEvent) => {
    // Optimistically apply
    setEvents(prev => [...prev, event]);
    
    // Send to server
    ws.send(JSON.stringify(event));
  };

  return <EventBasedRenderer events={events} />;
}
```

### Example 5: GraphQL Subscription

```tsx
import { useState } from "react";
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import { useSubscription, gql } from "@apollo/client";
import type { SpaceEvent } from "@shared/schema";

const SPACE_EVENTS_SUBSCRIPTION = gql`
  subscription SpaceEvents($spaceId: ID!) {
    spaceEvents(spaceId: $spaceId) {
      event
      ... on CreateViewEvent {
        id
        type
        style
      }
      ... on AddChildEvent {
        parentId
        childId
        index
      }
      # ... other event types
    }
  }
`;

function GraphQLApp({ spaceId }: { spaceId: string }) {
  const [events, setEvents] = useState<SpaceEvent[]>([]);

  useSubscription(SPACE_EVENTS_SUBSCRIPTION, {
    variables: { spaceId },
    onData: ({ data }) => {
      const event = data.data.spaceEvents;
      setEvents(prev => [...prev, event]);
    },
  });

  return <EventBasedRenderer events={events} />;
}
```

## Converting Existing Docs

Use the `docToEvents` helper to migrate from full schemas:

```tsx
import { docToEvents } from "@/core/renderer/docToEvents";
import { sampleDoc } from "@/core/sampleDoc";

const events = docToEvents(sampleDoc);
// Now send events instead of full doc
```

## Performance Considerations

### Batching
Group related events together to reduce renders:

```typescript
const batch: SpaceEvent = {
  event: "batch",
  events: [
    { event: "createView", ... },
    { event: "addChild", ... },
    { event: "updateStyle", ... },
  ]
};
```

### Debouncing
Debounce rapid style updates:

```typescript
const debouncedStyleUpdate = debounce((id: string, style: any) => {
  sendEvent({
    event: "updateStyle",
    id,
    style,
    merge: true,
  });
}, 16); // one frame
```

### Progressive Rendering
Render in layers to avoid blocking:

```typescript
// Layer 1: Critical (0ms)
sendEvents([createRoot, setRoot]);

// Layer 2: Structure (16ms)
setTimeout(() => sendEvents([createHeader, createContent]), 16);

// Layer 3: Content (32ms)
setTimeout(() => sendEvents([createItems]), 32);
```

## Network Protocol

### WebSocket

```typescript
// Client -> Server
{
  type: "event",
  spaceId: "space-123",
  event: { event: "createView", ... }
}

// Server -> Client
{
  type: "event",
  spaceId: "space-123",
  userId: "user-456",
  event: { event: "updateStyle", ... }
}
```

### GraphQL Mutation

```graphql
mutation ApplySpaceEvent($spaceId: ID!, $event: SpaceEventInput!) {
  applySpaceEvent(spaceId: $spaceId, event: $event) {
    success
    appliedEvent {
      ... SpaceEventFields
    }
  }
}
```

### REST API

```typescript
POST /api/spaces/:spaceId/events
Content-Type: application/json

{
  "event": "createView",
  "id": "my-view",
  "type": "View"
}
```

## Migration Path

1. **Phase 1**: Use `docToEvents()` to convert full schemas
2. **Phase 2**: Start using events for updates, full schema for initial load
3. **Phase 3**: Use events for everything, including initial load
4. **Phase 4**: Add real-time collaboration with subscriptions

## Comparison

| Feature | Full Schema | Event-Based |
|---------|-------------|-------------|
| Initial payload | 10-100 KB | 1-10 KB |
| Update payload | 10-100 KB | 0.1-1 KB |
| Animation support | Basic | Smooth |
| Real-time collab | Difficult | Easy |
| Optimistic updates | Hard | Easy |
| Network efficiency | Low | High |

## Best Practices

1. **Always create shared values first** before nodes that reference them
2. **Use batch events** for related changes
3. **Enable animations** for better UX (`animated: true`)
4. **Progressive render** complex UIs in layers
5. **Debounce rapid updates** to shared values
6. **Use indices** when order matters in `addChild`
7. **Clean up** with `deleteNode` when removing items

## Troubleshooting

### Shared value not found
Ensure `createSharedValue` event is processed before nodes that reference it.

### Node not appearing
Check that both `createView` and `addChild` events were sent, and `setRoot` for the root node.

### Animations not working
Set `animated: true` and provide a `duration` in update events.

### Layout shifts
Use Reanimated's `Layout` prop (already included in EventBasedRenderer).
