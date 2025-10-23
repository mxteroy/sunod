import { Button } from "@/components/button/Button";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { appleHoverInEasing, appleHoverOutEasing } from "@/core/easings";
import {
  type CollectionQuery,
  type SpaceEvent,
  type Style,
  type TextStyle,
} from "@shared/schema";
import { FlashList } from "@shopify/flash-list";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TextStyle as RNTextStyle, StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  makeMutable,
  runOnUI,
  SlideInDown,
  SlideOutDown,
  withTiming,
} from "react-native-reanimated";
import type { StoreApi, UseBoundStore } from "zustand";
import type { SpaceStore } from "../store";
import { useSpaceStore } from "../store";
import {
  useResolvedStyleColors,
  useResolvedTextStyleColors,
} from "../theme/useResolvedSchemaColors";
import type { SVMap } from "./FullSchemaRenderer";
import { useSplitAnimatedStyle } from "./styleSplitter";

/** -----------------------------------------------------------------------
 *  Event-Based Incremental Renderer
 *  - Processes events one by one to build up the UI
 *  - Supports smooth layout animations when adding/removing nodes
 *  - Much smaller payload than full schema updates
 *  - Enables real-time collaborative editing
 * --------------------------------------------------------------------- */

// Node state stored in the renderer
interface NodeState {
  id: string;
  type: "View" | "ThemedView" | "Text" | "Button" | "For";
  style?: Style | TextStyle;
  text?: string;
  glassEffect?: boolean;
  props?: any;
  onPanGestureStart?: any;
  onPanGestureChange?: any;
  onPanGestureEnd?: any;
  onPress?: any;
  children: (string | NodeState)[]; // child IDs or inline node objects (for templates)
  parentId?: string;
  // For node specific
  from?: CollectionQuery;
  as?: string;
  keyExpr?: string;
  horizontal?: boolean;
  template?: NodeState;
}

// Helper to execute actions (copied from Renderer.tsx)
function evalComputedValue(
  value: any,
  map: SVMap,
  eventData: Record<string, number>
): number {
  "worklet";
  if (typeof value === "number") return value;
  if (typeof value === "string") return eventData[value] ?? 0;

  if (value.type === "sharedRef") {
    const sv = map[value.ref];
    return sv ? (typeof sv.value === "number" ? sv.value : 0) : 0;
  }

  if (value.type === "computed") {
    const args = value.args.map((arg: any) => {
      return evalComputedValue(arg, map, eventData);
    });

    switch (value.op) {
      case "add":
        return args.reduce((a: number, b: number) => a + b, 0);
      case "sub":
        return args
          .slice(1)
          .reduce((a: number, b: number) => a - b, args[0] ?? 0);
      case "mul":
        return args.reduce((a: number, b: number) => a * b, 1);
      case "div":
        return args
          .slice(1)
          .reduce(
            (a: number, b: number) => a / (b === 0 ? 1 : b),
            args[0] ?? 0
          );
      case "clamp": {
        const [x, min, max] = [args[0] ?? 0, args[1] ?? 0, args[2] ?? 1];
        return Math.min(Math.max(x, min), max);
      }
      case "lerp": {
        const [a, b, t] = [args[0] ?? 0, args[1] ?? 0, args[2] ?? 0];
        return a + (b - a) * t;
      }
      case "min":
        return Math.min(...args);
      case "max":
        return Math.max(...args);
      default:
        return 0;
    }
  }

  return 0;
}

function executeAction(
  action: any,
  map: SVMap,
  eventData: Record<string, number>
) {
  "worklet";

  switch (action.type) {
    case "setSharedValue": {
      const target = map[action.target];
      if (!target) return;

      const computedValue = evalComputedValue(action.value, map, eventData);

      switch (action.operation) {
        case "add":
          target.value += computedValue;
          break;
        case "sub":
          target.value -= computedValue;
          break;
        case "mul":
          target.value *= computedValue;
          break;
        case "div":
          if (computedValue !== 0) {
            target.value /= computedValue;
          }
          break;
        case "set":
          target.value = computedValue;
          break;
      }
      break;
    }

    case "log": {
      const message = action.message || "Log:";
      if (action.values) {
        const resolvedValues = action.values.map((v: any) => {
          if (typeof v === "number" || typeof v === "string") return v;
          if (v.type === "sharedRef") {
            const sv = map[v.ref];
            return sv ? sv.value : undefined;
          }
          return v;
        });
        console.log(message, ...resolvedValues);
      } else {
        console.log(message);
      }
      break;
    }

    case "conditional": {
      const left = evalComputedValue(action.condition.left, map, eventData);
      const right = evalComputedValue(action.condition.right, map, eventData);

      let conditionMet = false;
      switch (action.condition.op) {
        case ">":
          conditionMet = left > right;
          break;
        case ">=":
          conditionMet = left >= right;
          break;
        case "<":
          conditionMet = left < right;
          break;
        case "<=":
          conditionMet = left <= right;
          break;
        case "==":
          conditionMet = left === right;
          break;
        case "!=":
          conditionMet = left !== right;
          break;
      }

      const actionsToExecute = conditionMet ? action.then : action.else || [];
      for (const a of actionsToExecute) {
        executeAction(a, map, eventData);
      }
      break;
    }

    case "animate": {
      const target = map[action.target];
      if (!target) return;

      const toValue = evalComputedValue(action.to, map, eventData);
      const duration = action.duration || 300;

      let easing = Easing.inOut(Easing.ease);
      switch (action.easing) {
        case "linear":
          easing = Easing.linear;
          break;
        case "easeIn":
          easing = Easing.in(Easing.ease);
          break;
        case "easeOut":
          easing = Easing.out(Easing.ease);
          break;
        case "easeInOut":
          easing = Easing.inOut(Easing.ease);
          break;
        case "spring":
          target.value = withTiming(toValue, { duration: duration / 2 });
          return;
      }

      target.value = withTiming(toValue, { duration, easing });
      break;
    }

    case "createRecord":
    case "updateRecord":
    case "deleteRecord":
      // These actions need to run outside worklet context
      // They will be handled by executeHandlerWithStore
      console.warn(
        `Data action ${action.type} called in worklet context - use executeHandlerWithStore instead`
      );
      break;
  }
}

function executeHandler(
  handler: any[],
  map: SVMap,
  eventData: Record<string, number>
) {
  "worklet";
  for (const action of handler) {
    executeAction(action, map, eventData);
  }
}

// Non-worklet version that can handle data actions
function executeHandlerWithStore(
  handler: any[],
  map: SVMap,
  eventData: Record<string, number>,
  store?: UseBoundStore<StoreApi<SpaceStore>>
) {
  for (const action of handler) {
    if (!action || !action.type) continue;

    // Handle data actions that need store access
    if (
      action.type === "createRecord" ||
      action.type === "updateRecord" ||
      action.type === "deleteRecord"
    ) {
      if (!store) {
        console.warn(`${action.type} requires store but none provided`);
        continue;
      }

      const storeState = store.getState();

      if (action.type === "createRecord") {
        const record = action.record || {};
        storeState.createRecord(action.collection, record);
        console.log("Created record in collection", action.collection, record);
      } else if (action.type === "updateRecord") {
        const patch = action.patch || {};
        storeState.updateRecord(action.collection, action.id, patch);
      } else if (action.type === "deleteRecord") {
        storeState.deleteRecord(action.collection, action.id);
      }
    } else {
      // For other actions, run them in worklet context
      runOnUI(() => {
        "worklet";
        executeAction(action, map, eventData);
      })();
    }
  }
}

// -------------------- Node Renderers --------------------
function RenderViewNode({
  node,
  nodes,
  map,
  isRoot = false,
  store,
  itemContext,
  itemVar,
}: {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
  isRoot?: boolean;
  store?: UseBoundStore<StoreApi<SpaceStore>>;
  itemContext?: any;
  itemVar?: string;
}) {
  const themed = node.type === "ThemedView";
  const resolvedStyles = useResolvedStyleColors(node.style);

  // Create gestures based on node configuration
  const gestures = useMemo(() => {
    const gestureList = [];

    if (
      node.onPanGestureStart ||
      node.onPanGestureChange ||
      node.onPanGestureEnd
    ) {
      let pan = Gesture.Pan();

      if (node.onPanGestureStart) {
        pan = pan.onStart((e) => {
          "worklet";
          const eventData = {
            x: e.x,
            y: e.y,
            absoluteX: e.absoluteX,
            absoluteY: e.absoluteY,
          };
          executeHandler(node.onPanGestureStart, map, eventData);
        });
      }

      if (node.onPanGestureChange) {
        pan = pan.onChange((e) => {
          "worklet";
          const eventData = {
            changeX: e.changeX,
            changeY: e.changeY,
            translationX: e.translationX,
            translationY: e.translationY,
            velocityX: e.velocityX,
            velocityY: e.velocityY,
            x: e.x,
            y: e.y,
            absoluteX: e.absoluteX,
            absoluteY: e.absoluteY,
          };
          executeHandler(node.onPanGestureChange, map, eventData);
        });
      }

      if (node.onPanGestureEnd) {
        pan = pan.onEnd((e) => {
          "worklet";
          const eventData = {
            x: e.x,
            y: e.y,
            absoluteX: e.absoluteX,
            absoluteY: e.absoluteY,
            velocityX: e.velocityX,
            velocityY: e.velocityY,
            translationX: e.translationX,
            translationY: e.translationY,
          };
          executeHandler(node.onPanGestureEnd, map, eventData);
        });
      }

      gestureList.push(pan);
    }

    if (node.onPress) {
      const tap = Gesture.Tap().onEnd(() => {
        "worklet";
        executeHandler(node.onPress, map, {});
      });
      gestureList.push(tap);
    }

    return gestureList.length > 0
      ? gestureList.length === 1
        ? gestureList[0]
        : Gesture.Simultaneous(...gestureList)
      : null;
  }, [
    node.onPanGestureStart,
    node.onPanGestureChange,
    node.onPanGestureEnd,
    node.onPress,
    map,
  ]);

  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Render children
  const children = node.children.map((childIdOrNode, index) => {
    // Handle both node IDs (string) and inline node objects (for templates)
    if (typeof childIdOrNode === "string") {
      const childNode = nodes.get(childIdOrNode);
      if (!childNode) return null;
      return (
        <RenderNode
          key={childIdOrNode}
          node={childNode}
          nodes={nodes}
          map={map}
          isRoot={false}
          store={store}
          itemContext={itemContext}
          itemVar={itemVar}
        />
      );
    } else if (typeof childIdOrNode === "object" && childIdOrNode.id) {
      // Inline node object (used in templates)
      return (
        <RenderNode
          key={childIdOrNode.id || index}
          node={childIdOrNode as NodeState}
          nodes={nodes}
          map={map}
          isRoot={false}
          store={store}
          itemContext={itemContext}
          itemVar={itemVar}
        />
      );
    }
    return null;
  });

  const ViewBody = (
    <ThemedView
      style={staticStyle as StyleProp<ViewStyle>}
      {...(themed ? { aStyle: aStyle as StyleProp<ViewStyle> } : {})}
      noTheme={!themed}
    >
      {children}
    </ThemedView>
  );

  // Skip animations for root node to prevent layout issues on iOS
  if (isRoot) {
    return gestures ? (
      <GestureDetector gesture={gestures}>{ViewBody}</GestureDetector>
    ) : (
      ViewBody
    );
  }

  // Wrap with animated view for layout transitions
  const AnimatedBody = (
    <Animated.View
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
    >
      {gestures ? (
        <GestureDetector gesture={gestures}>{ViewBody}</GestureDetector>
      ) : (
        ViewBody
      )}
    </Animated.View>
  );

  return AnimatedBody;
}

function RenderTextNode({
  node,
  map,
  store,
  itemContext,
  itemVar,
}: {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
  store?: UseBoundStore<StoreApi<SpaceStore>>;
  itemContext?: any;
  itemVar?: string;
}) {
  const resolvedStyles = useResolvedTextStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Resolve template strings like {{todo.title}}
  const resolvedText = useMemo(() => {
    if (!node.text || !itemContext || !itemVar) return node.text;

    // Simple template string resolution: {{itemVar.field}}
    return node.text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();

      // Handle simple paths like "todo.title" or "item.done"
      if (trimmedPath.startsWith(`${itemVar}.`)) {
        const field = trimmedPath.substring(itemVar.length + 1);
        const value = itemContext[field];
        return value !== undefined ? String(value) : match;
      }

      return match;
    });
  }, [node.text, itemContext, itemVar]);

  console.log("resolvedText", resolvedText);
  return (
    <Animated.View
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
    >
      <ThemedText
        aStyle={[aStyle as StyleProp<RNTextStyle>]}
        style={staticStyle as StyleProp<RNTextStyle>}
      >
        {resolvedText}
      </ThemedText>
    </Animated.View>
  );
}

function RenderButtonNode({
  node,
  map,
  store,
  itemContext,
  itemVar,
}: {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
  store?: UseBoundStore<StoreApi<SpaceStore>>;
  itemContext?: any;
  itemVar?: string;
}) {
  const resolvedStyles = useResolvedStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Resolve template strings in button text
  const resolvedText = useMemo(() => {
    if (!node.text || !itemContext || !itemVar) return node.text;

    return node.text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      if (trimmedPath.startsWith(`${itemVar}.`)) {
        const field = trimmedPath.substring(itemVar.length + 1);
        const value = itemContext[field];
        return value !== undefined ? String(value) : match;
      }
      return match;
    });
  }, [node.text, itemContext, itemVar]);

  const handlePress = () => {
    if (node.onPress) {
      // Use executeHandlerWithStore to support data actions
      executeHandlerWithStore(node.onPress, map, {}, store);
    }
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
    >
      <Button
        title={resolvedText || ""}
        style={staticStyle as StyleProp<ViewStyle>}
        aStyle={aStyle as StyleProp<ViewStyle>}
        onPress={node.onPress ? handlePress : undefined}
      />
    </Animated.View>
  );
}

function RenderForNode({
  node,
  nodes,
  map,
  store,
}: {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
  store: UseBoundStore<StoreApi<SpaceStore>>;
}) {
  const resolvedStyles = useResolvedStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Get collection data from Zustand store
  const collectionKey = node.from?.key || "";

  // Select the collection object itself, not the values array
  // This prevents creating new arrays on every render
  const collection = store(
    useCallback(
      (state: SpaceStore) => state.collections[collectionKey],
      [collectionKey]
    )
  );

  // Convert to array only when collection reference changes
  const items = useMemo(
    () => (collection ? Object.values(collection) : []),
    [collection]
  );

  // Apply sorting if specified
  const sortedItems = useMemo(() => {
    if (!node.from?.orderBy || node.from.orderBy.length === 0) return items;

    return [...items].sort((a, b) => {
      for (const order of node.from!.orderBy!) {
        const aVal = a[order.field];
        const bVal = b[order.field];

        if (aVal < bVal) return order.dir === "asc" ? -1 : 1;
        if (aVal > bVal) return order.dir === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [items, node.from]);

  // Apply limit if specified
  const finalItems = useMemo(() => {
    console.log("final items size", sortedItems.length);
    if (!node.from?.limit) return sortedItems;
    return sortedItems.slice(0, node.from.limit);
  }, [sortedItems, node.from?.limit]);

  // Render function for each item
  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (!node.template) {
        console.log("For node missing template");
        return null;
      }

      // Create a scoped context for the item
      // The template can reference item.field in bindings
      // For now, we'll render the template as-is
      // In the future, we can add context support for binding resolution
      return (
        <RenderNode
          node={node.template}
          nodes={nodes}
          map={map}
          isRoot={false}
          store={store}
          itemContext={item}
          itemVar={node.as || "item"}
        />
      );
    },
    [node.template, node.as, nodes, map, store]
  );

  // Extract key from item
  const keyExtractor = useCallback(
    (item: any, index: number) => {
      if (node.keyExpr) {
        // Simple path resolution (e.g., "item.id" -> item.id)
        const path = node.keyExpr.replace(`${node.as || "item"}.`, "");
        return String(item[path] ?? index);
      }
      return item.id ?? String(index);
    },
    [node.keyExpr, node.as]
  );

  return (
    <Animated.View
      style={[staticStyle, aStyle] as StyleProp<ViewStyle>}
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
    >
      <FlashList
        data={finalItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal={node.horizontal}
      />
    </Animated.View>
  );
}

// Memoize node rendering to prevent unnecessary re-renders
const RenderNode = React.memo(
  function RenderNode({
    node,
    nodes,
    map,
    isRoot = false,
    store,
    itemContext,
    itemVar,
  }: {
    node: NodeState;
    nodes: Map<string, NodeState>;
    map: SVMap;
    isRoot?: boolean;
    store?: UseBoundStore<StoreApi<SpaceStore>>;
    itemContext?: any;
    itemVar?: string;
  }) {
    switch (node.type) {
      case "View":
      case "ThemedView":
        return (
          <RenderViewNode
            node={node}
            nodes={nodes}
            map={map}
            isRoot={isRoot}
            store={store}
            itemContext={itemContext}
            itemVar={itemVar}
          />
        );
      case "Text":
        return (
          <RenderTextNode
            node={node}
            nodes={nodes}
            map={map}
            store={store}
            itemContext={itemContext}
            itemVar={itemVar}
          />
        );
      case "Button":
        return (
          <RenderButtonNode
            node={node}
            nodes={nodes}
            map={map}
            store={store}
            itemContext={itemContext}
            itemVar={itemVar}
          />
        );
      case "For":
        if (!store) {
          console.warn("For node requires store prop");
          return null;
        }
        return (
          <RenderForNode node={node} nodes={nodes} map={map} store={store} />
        );
      default:
        return null;
    }
  },
  // Custom equality check - only re-render if node changes
  (prevProps, nextProps) => {
    return (
      prevProps.node === nextProps.node &&
      prevProps.isRoot === nextProps.isRoot &&
      prevProps.map === nextProps.map
      // Note: We don't check nodes Map equality as it changes frequently
      // but children will re-render naturally when their node changes
    );
  }
);

// -------------------- Main Event-Based Renderer --------------------
export default function EventBasedRenderer({
  events = [],
  spaceId = "default",
  store: externalStore,
}: {
  events?: SpaceEvent[];
  spaceId?: string;
  store?: UseBoundStore<StoreApi<SpaceStore>>;
}) {
  const [nodes, setNodes] = useState<Map<string, NodeState>>(new Map());
  const [rootId, setRootId] = useState<string | null>(null);
  const sharedValuesRef = useRef<SVMap>({});

  // Create store internally if not provided
  const internalStore = useSpaceStore(spaceId);
  const store = externalStore || internalStore;

  console.log("EventBasedRenderer render - received events:", events?.length);

  // Process events
  const processEvent = useCallback((event: SpaceEvent): void => {
    console.log("Processing event:", event.event, event);

    switch (event.event) {
      case "createSharedValue": {
        // Create shared value lazily if it doesn't exist using makeMutable (doesn't require hooks)
        if (!sharedValuesRef.current[event.id]) {
          sharedValuesRef.current[event.id] = makeMutable(event.initial);
        }
        break;
      }

      case "updateSharedValue": {
        const sv = sharedValuesRef.current[event.id];
        if (sv) {
          if (event.animated && typeof event.value === "number") {
            sv.value = withTiming(event.value, {
              duration: event.duration || 300,
            });
          } else {
            sv.value = event.value;
          }
        }
        break;
      }

      case "createView": {
        setNodes((prev) => {
          // Optimization: Only create new Map if node doesn't exist
          if (prev.has(event.id)) return prev;

          const next = new Map(prev);
          const newNode: NodeState = {
            id: event.id,
            type: event.type,
            style: event.style,
            text: event.text,
            glassEffect: event.glassEffect,
            props: event.props,
            onPanGestureStart: event.onPanGestureStart,
            onPanGestureChange: event.onPanGestureChange,
            onPanGestureEnd: event.onPanGestureEnd,
            onPress: event.onPress,
            children: [],
          };

          // Add For node specific properties
          if (event.type === "For") {
            newNode.from = (event as any).from;
            newNode.as = (event as any).as;
            newNode.keyExpr = (event as any).keyExpr;
            newNode.horizontal = (event as any).horizontal;
            newNode.template = (event as any).template;
          }

          next.set(event.id, newNode);
          return next;
        });
        break;
      }

      case "addChild": {
        setNodes((prev) => {
          const next = new Map(prev);
          const parent = next.get(event.parentId);
          const child = next.get(event.childId);

          if (parent && child) {
            // Update parent's children
            const newChildren = [...parent.children];
            if (event.index !== undefined) {
              newChildren.splice(event.index, 0, event.childId);
            } else {
              newChildren.push(event.childId);
            }
            next.set(event.parentId, { ...parent, children: newChildren });

            // Update child's parent
            next.set(event.childId, { ...child, parentId: event.parentId });
          }
          return next;
        });
        break;
      }

      case "removeChild": {
        setNodes((prev) => {
          const next = new Map(prev);
          const parent = next.get(event.parentId);
          const child = next.get(event.childId);

          if (parent && child) {
            const newChildren = parent.children.filter((childIdOrNode) => {
              // Handle both string IDs and inline node objects
              if (typeof childIdOrNode === "string") {
                return childIdOrNode !== event.childId;
              } else if (typeof childIdOrNode === "object") {
                return childIdOrNode.id !== event.childId;
              }
              return true;
            });
            next.set(event.parentId, { ...parent, children: newChildren });
            next.set(event.childId, { ...child, parentId: undefined });
          }
          return next;
        });
        break;
      }

      case "updateStyle": {
        setNodes((prev) => {
          const next = new Map(prev);
          const node = next.get(event.id);

          if (node) {
            const newStyle = event.merge
              ? { ...node.style, ...event.style }
              : event.style;
            next.set(event.id, { ...node, style: newStyle });
          }
          return next;
        });
        break;
      }

      case "updateText": {
        setNodes((prev) => {
          const next = new Map(prev);
          const node = next.get(event.id);

          if (node) {
            next.set(event.id, { ...node, text: event.text });
          }
          return next;
        });
        break;
      }

      case "deleteNode": {
        setNodes((prev) => {
          const next = new Map(prev);
          const node = next.get(event.id);

          if (node && node.parentId) {
            // Remove from parent first
            const parent = next.get(node.parentId);
            if (parent) {
              const newChildren = parent.children.filter((childIdOrNode) => {
                // Handle both string IDs and inline node objects
                if (typeof childIdOrNode === "string") {
                  return childIdOrNode !== event.id;
                } else if (typeof childIdOrNode === "object") {
                  return childIdOrNode.id !== event.id;
                }
                return true;
              });
              next.set(node.parentId, { ...parent, children: newChildren });
            }
          }

          // Delete the node
          next.delete(event.id);
          return next;
        });
        break;
      }

      case "setRoot": {
        setRootId(event.id);
        break;
      }

      case "batch": {
        // Recursively process batch events
        if (event.events && Array.isArray(event.events)) {
          event.events.forEach((e) => {
            // Call processEvent for each event in the batch
            processEvent(e);
          });
        }
        break;
      }
    }
  }, []);

  // Track how many events we've processed to avoid reprocessing
  const processedCountRef = useRef(0);

  // Process only NEW events incrementally
  useEffect(() => {
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }

    // Only process events we haven't seen yet
    const newEvents = events.slice(processedCountRef.current);
    if (newEvents.length === 0) return;

    console.log("Processing", newEvents.length, "new events");
    newEvents.forEach(processEvent);
    processedCountRef.current = events.length;
  }, [events, processEvent]);

  // Safety check
  if (!Array.isArray(events)) {
    console.error("EventBasedRenderer: events is not an array", events);
    return null;
  }

  // Render root node
  if (!rootId) {
    console.log("No root ID set yet");
    return null;
  }

  const rootNode = nodes.get(rootId);
  if (!rootNode) {
    console.log("Root node not found:", rootId);
    return null;
  }

  return (
    <RenderNode
      node={rootNode}
      nodes={nodes}
      map={sharedValuesRef.current}
      isRoot={true}
      store={store}
    />
  );
}
