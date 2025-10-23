# Todo List Implementation - Summary

## Overview

Implemented a generic List node system with Zustand state management for building dynamic lists like todo lists without manually creating new nodes for each item.

## What Was Implemented

### 1. Schema Additions (`shared/schema.ts`)

#### Collections & Data Model

- **`zCollectionDef`**: Defines collection structure (key, shape, sort, filter)
- **`zCollectionQuery`**: Query collections with filtering, sorting, and limits
- **`zFor`**: Virtual list node that renders a template for each item in a collection
  - Supports horizontal/vertical layouts
  - Custom key expressions
  - Loop variable naming (`as: "item"`)

#### Data Actions

- **`zCreateRecordAction`**: Add records to collections
- **`zUpdateRecordAction`**: Update existing records
- **`zDeleteRecordAction`**: Remove records from collections

#### Updates

- Added `For` to node union
- Added `collections` array to `SpaceDoc`
- Updated `zCreateViewEvent` to support For node properties

### 2. Zustand Store Infrastructure (`client/core/store/`)

#### Store Factory (`spaceStore.ts`)

- Per-space isolated stores
- Collections stored as `Record<id, RecordData>`
- CRUD operations: `createRecord`, `updateRecord`, `deleteRecord`, `setShared`
- Helper: `getCollectionArray` for easy array access
- `subscribeWithSelector` middleware for optimized subscriptions

#### Selectors (`selectors.ts`)

- `useCollection`: Get array of records with shallow comparison
- `useRecord`: Get single record by ID
- `useShared`: Access shared values
- `useStoreActions`: Get store actions without re-renders

#### Registry (`registry.ts`)

- `useSpaceStore`: Get/create store for a space ID
- `getSpaceStore`: Non-React access for action interpreters
- `removeSpaceStore`: Cleanup on unmount
- `clearAllStores`: Testing utility

### 3. Event-Based Renderer Updates (`EventBasedRenderer.tsx`)

#### New Props

- `spaceId`: Required for store registry
- `store`: Optional Zustand store instance

#### RenderForNode Component

- Reads collection data from Zustand store
- Applies sorting (`orderBy`)
- Applies limits
- Uses `FlashList` for optimized rendering
- Supports horizontal layout
- Custom key extraction
- Memoized render function

#### Action Execution

- **`executeHandlerWithStore`**: Non-worklet version that supports data actions
- Data actions (`createRecord`, `updateRecord`, `deleteRecord`) interact with Zustand
- Other actions run in worklet context via `runOnUI`
- Button press handlers use `executeHandlerWithStore`

#### Store Propagation

- All render functions now accept optional `store` prop
- Store passed down through component tree
- Required for For nodes to function

### 4. Example Document (`todoListExample.ts`)

Simple todo list POC showing:

- Collection definition for todos
- Root container setup
- Add Todo button with `createRecord` action
- For node rendering list of todos
- Template structure for todo items

## Key Design Decisions

### 1. **Zustand Over React State**

- **Why**: Better for action-driven updates, selective subscriptions, decoupled from React
- **Benefits**: No prop drilling, works outside render, efficient re-renders
- **Pattern**: One store per Space instance

### 2. **FlashList for Performance**

- **Why**: Optimized for React Native, better than FlatList for large lists
- **Benefits**: Recycling, better memory usage, smooth scrolling
- **Horizontal Support**: Built-in via `horizontal` prop

### 3. **Separate Action Executors**

- **`executeAction`**: Worklet-based for shared values (runs on UI thread)
- **`executeHandlerWithStore`**: JS-based for data actions (runs on JS thread)
- **Why**: Zustand can't be accessed in worklets

### 4. **Template-Based Rendering**

- **Pattern**: List node + template = repeater
- **Benefits**: Data changes don't modify UI tree structure
- **Future**: Context binding for `{{item.title}}` syntax

## What's Missing (Next Steps)

### 1. Context Binding

Currently `{{todo.title}}` is just a string. Need to:

- Parse template strings in render functions
- Resolve paths like `item.title` from context
- Support in text content, action parameters, and bindings

### 2. Collection Filtering

`where` clause in queries not yet implemented:

```typescript
where: {
  sectionId: "{{section.id}}";
}
```

### 3. Nested Lists

Sections containing todo lists (list within list)

### 4. Enhanced Template

- Checkbox component
- Toggle actions
- Better styling support

### 5. Persistence

Collections currently in-memory only. Could add:

- AsyncStorage persistence via Zustand middleware
- GraphQL sync layer
- Optimistic updates

## Usage Example

```typescript
import { useSpaceStore } from "@/core/store";
import EventBasedRenderer from "@/core/renderer/EventBasedRenderer";
import { todoListEvents, todoCollections } from "@/core/renderer/todoListExample";

function TodoListScreen() {
  const spaceId = "todo-poc";
  const store = useSpaceStore(spaceId, todoCollections);

  // Seed some initial data
  useEffect(() => {
    const state = store.getState();
    if (state.getCollectionArray("todos").length === 0) {
      state.createRecord("todos", { title: "First todo", done: false });
      state.createRecord("todos", { title: "Second todo", done: true });
    }
  }, [store]);

  return (
    <EventBasedRenderer
      spaceId={spaceId}
      store={store}
      events={todoListEvents}
    />
  );
}
```

## Architecture Benefits

1. **Generic**: Works for any list (todos, messages, items, etc.)
2. **Performant**: FlashList + selective Zustand subscriptions
3. **Scalable**: Per-space stores, no global state pollution
4. **Testable**: Pure data operations, easy to mock
5. **Future-proof**: Ready for GraphQL migration, persistence, undo/redo

## File Structure

```
client/
├── core/
│   ├── store/
│   │   ├── index.ts              # Exports
│   │   ├── spaceStore.ts         # Store factory
│   │   ├── selectors.ts          # Optimized hooks
│   │   └── registry.ts           # Per-space registry
│   └── renderer/
│       ├── EventBasedRenderer.tsx # Updated with For node
│       └── todoListExample.ts     # POC example
shared/
└── schema.ts                      # Updated with collections & actions
```

## Testing Checklist

- [ ] Create store and add records
- [ ] Render For node with FlashList
- [ ] Add todo via button action
- [ ] Delete todo
- [ ] Update todo
- [ ] Multiple collections in one space
- [ ] Horizontal list layout
- [ ] Sorting and limits
- [ ] Context binding (when implemented)
