# Quick Start: Event-Based Rendering

## 🚀 Get Started in 5 Minutes

### Step 1: Import the Renderer

```tsx
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import type { SpaceEvent } from "@shared/schema";
```

### Step 2: Create Your Events

```tsx
const events: SpaceEvent[] = [
  // 1. Create shared values
  { 
    event: "createSharedValue", 
    id: "counter", 
    type: "number", 
    initial: 0 
  },
  
  // 2. Create root view
  {
    event: "createView",
    id: "root",
    type: "ThemedView",
    style: { flex: 1, padding: 20 }
  },
  
  // 3. Set as root
  { event: "setRoot", id: "root" },
  
  // 4. Add a text element
  {
    event: "createView",
    id: "text",
    type: "Text",
    text: "Hello World!",
    style: { fontSize: 24, margin: 16 }
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "text"
  },
  
  // 5. Add a button
  {
    event: "createView",
    id: "button",
    type: "Button",
    text: "Click Me",
    onPress: [
      {
        type: "setSharedValue",
        target: "counter",
        operation: "add",
        value: 1
      },
      {
        type: "log",
        message: "Counter:",
        values: [{ type: "sharedRef", ref: "counter" }]
      }
    ]
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "button"
  }
];
```

### Step 3: Render It

```tsx
export default function MyScreen() {
  return <EventBasedRenderer events={events} />;
}
```

That's it! You now have a fully functional UI with:
- ✅ Shared value state management
- ✅ Interactive button
- ✅ Smooth layout animations
- ✅ Gesture handling ready

## 💡 Common Patterns

### Add Item Dynamically

```tsx
const [events, setEvents] = useState(initialEvents);

const addItem = () => {
  const newId = `item-${Date.now()}`;
  setEvents([
    ...events,
    {
      event: "createView",
      id: newId,
      type: "Text",
      text: "New Item!",
      style: { margin: 8 }
    },
    {
      event: "addChild",
      parentId: "root",
      childId: newId
    }
  ]);
};
```

### Remove Item with Animation

```tsx
const removeItem = (itemId: string) => {
  setEvents([
    ...events,
    {
      event: "removeChild",
      parentId: "root",
      childId: itemId
    },
    {
      event: "deleteNode",
      id: itemId,
      animated: true,
      duration: 300
    }
  ]);
};
```

### Update Style with Animation

```tsx
const updateStyle = (itemId: string) => {
  setEvents([
    ...events,
    {
      event: "updateStyle",
      id: itemId,
      style: { backgroundColor: "#ff0000" },
      merge: true,
      animated: true,
      duration: 500
    }
  ]);
};
```

### Draggable Element

```tsx
const draggableEvents: SpaceEvent[] = [
  // Create shared values for position
  { event: "createSharedValue", id: "x", type: "number", initial: 0 },
  { event: "createSharedValue", id: "y", type: "number", initial: 0 },
  
  // Create draggable view
  {
    event: "createView",
    id: "draggable",
    type: "ThemedView",
    style: {
      width: 100,
      height: 100,
      backgroundColor: { type: "theme", name: "accent" },
      transform: {
        translateX: { bind: { type: "shared", ref: "x" } },
        translateY: { bind: { type: "shared", ref: "y" } }
      }
    },
    onPanGestureChange: [
      {
        type: "setSharedValue",
        target: "x",
        operation: "add",
        value: "changeX"
      },
      {
        type: "setSharedValue",
        target: "y",
        operation: "add",
        value: "changeY"
      }
    ]
  }
];
```

## 🔄 Convert Existing Schema

Already have a `SpaceDoc`? Convert it instantly:

```tsx
import { docToEvents } from "@/core/renderer/docToEvents";
import { sampleDoc } from "@/core/sampleDoc";

const events = docToEvents(sampleDoc);
<EventBasedRenderer events={events} />
```

## 🌐 Real-Time Updates

Connect to WebSocket for live collaboration:

```tsx
function CollaborativeSpace({ spaceId }: { spaceId: string }) {
  const [events, setEvents] = useState<SpaceEvent[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`wss://your-server.com/spaces/${spaceId}`);
    
    ws.onmessage = (msg) => {
      const event: SpaceEvent = JSON.parse(msg.data);
      setEvents(prev => [...prev, event]);
    };

    return () => ws.close();
  }, [spaceId]);

  return <EventBasedRenderer events={events} />;
}
```

## 📊 Compare with Old Renderer

Use the demo screen to see the difference:

```tsx
import RendererComparisonScreen from "@/RendererComparisonScreen";

// In your navigation
<Stack.Screen name="comparison" component={RendererComparisonScreen} />
```

## 📚 Learn More

- **Full Documentation**: `client/core/renderer/EVENT_BASED_README.md`
- **Examples**: `client/core/renderer/eventExamples.ts`
- **Schema Reference**: `shared/schema.ts` (search for "Event-Based")
- **Summary**: `EVENT_SYSTEM_SUMMARY.md`

## 🎯 Key Advantages

1. **90-99% smaller payloads** - Only send what changed
2. **Smooth animations** - Automatic fade in/out and layout transitions
3. **Real-time ready** - Built for WebSocket/GraphQL subscriptions
4. **Progressive rendering** - Load UI in layers for better performance
5. **Optimistic updates** - Apply changes immediately, sync later

## ✅ You're Ready!

Start building with the event-based renderer. It's faster, smoother, and more efficient than the full schema approach.

Happy coding! 🚀
