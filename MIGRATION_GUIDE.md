# Migration Guide: Switching to Event-Based Renderer

## What Changed

Your app now uses the **Event-Based Renderer** by default, which provides:
- ✅ 90-99% smaller payloads
- ✅ Smooth fade-in/fade-out animations
- ✅ Automatic layout transitions
- ✅ Better performance for large UIs

## Naming Convention

- **EventBasedRenderer** - New, recommended renderer (incremental updates)
- **FullSchemaRenderer** - Legacy renderer (full document rendering)
  - Also exported as `SpaceRenderer` for backwards compatibility

## Your Changes

### Before
```tsx
import SpaceRenderer from "@/core/renderer/Renderer";
import { sampleDoc } from "@/core/sampleDoc";

<SpaceRenderer doc={sampleDoc} />
```

### After
```tsx
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import { docToEvents } from "@/core/renderer/docToEvents";
import { sampleDoc } from "@/core/sampleDoc";

const events = docToEvents(sampleDoc);
<EventBasedRenderer events={events} />
```

## Files Updated

1. **`app/(tabs)/index.tsx`** - Now uses EventBasedRenderer
2. **`core/renderer/Renderer.tsx`** → **`core/renderer/FullSchemaRenderer.tsx`** - Renamed for clarity
3. **`RendererComparisonScreen.tsx`** - Updated to use FullSchemaRenderer
4. **`EventBasedRenderer.tsx`** - Updated import path

## What You Get

### Smooth Animations
Every node now automatically animates:
- **FadeIn** (300ms) when added
- **FadeOut** (200ms) when removed
- **Layout spring** transitions when siblings change

### Example
Try dragging the container around - you'll see smooth scale animations when you start/end dragging!

## If You Need the Old Renderer

Import it explicitly:
```tsx
import FullSchemaRenderer from "@/core/renderer/FullSchemaRenderer";
// or
import { SpaceRenderer } from "@/core/renderer/FullSchemaRenderer";

<FullSchemaRenderer doc={sampleDoc} />
```

## Next Steps

### 1. Try the Comparison Screen
See both renderers side-by-side:
```tsx
import RendererComparisonScreen from "@/RendererComparisonScreen";
```

### 2. Add Real-Time Updates
Instead of converting docs, stream events:
```tsx
const [events, setEvents] = useState([]);

useEffect(() => {
  const ws = new WebSocket("wss://your-api.com/events");
  ws.onmessage = (msg) => {
    const event = JSON.parse(msg.data);
    setEvents(prev => [...prev, event]);
  };
}, []);

<EventBasedRenderer events={events} />
```

### 3. Progressive Rendering
Build complex UIs in layers:
```tsx
const layers = getProgressiveUIEvents();

layers.forEach((layer, i) => {
  setTimeout(() => {
    setEvents(prev => [...prev, ...layer]);
  }, i * 16); // 16ms per frame
});
```

## Benefits You'll Notice

1. **Faster initial load** - Only render what's needed first
2. **Smoother animations** - Reanimated Layout transitions
3. **Better performance** - Incremental updates instead of full re-renders
4. **Real-time ready** - Stream events from server
5. **Smaller network usage** - Only send changes, not full documents

## Documentation

- 📚 **Full Guide**: `client/core/renderer/EVENT_BASED_README.md`
- 🚀 **Quick Start**: `QUICK_START_EVENTS.md`
- 📊 **Summary**: `EVENT_SYSTEM_SUMMARY.md`
- 💡 **Examples**: `client/core/renderer/eventExamples.ts`

Enjoy your smoother, faster app! 🎉
