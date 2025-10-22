import { Button } from "@/components/button/Button";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { appleHoverInEasing, appleHoverOutEasing } from "@/core/easings";
import { type SpaceEvent, type Style, type TextStyle } from "@shared/schema";
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
  type: "View" | "ThemedView" | "Text" | "Button";
  style?: Style | TextStyle;
  text?: string;
  glassEffect?: boolean;
  props?: any;
  onPanGestureStart?: any;
  onPanGestureChange?: any;
  onPanGestureEnd?: any;
  onPress?: any;
  children: string[]; // child IDs
  parentId?: string;
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

// -------------------- Node Renderers --------------------
function RenderViewNode({
  node,
  nodes,
  map,
  isRoot = false,
}: {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
  isRoot?: boolean;
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
  const children = node.children.map((childId) => {
    const childNode = nodes.get(childId);
    if (!childNode) return null;
    return (
      <RenderNode
        key={childId}
        node={childNode}
        nodes={nodes}
        map={map}
        isRoot={false}
      />
    );
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
}: {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
}) {
  const resolvedStyles = useResolvedTextStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  return (
    <Animated.View
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
    >
      <ThemedText
        aStyle={[aStyle as StyleProp<RNTextStyle>]}
        style={staticStyle as StyleProp<RNTextStyle>}
      >
        {node.text}
      </ThemedText>
    </Animated.View>
  );
}

function RenderButtonNode({
  node,
  map,
}: {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
}) {
  const resolvedStyles = useResolvedStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  const handlePress = () => {
    if (node.onPress) {
      runOnUI(() => {
        "worklet";
        executeHandler(node.onPress, map, {});
      })();
    }
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
    >
      <Button
        title={node.text || ""}
        style={staticStyle as StyleProp<ViewStyle>}
        aStyle={aStyle as StyleProp<ViewStyle>}
        onPress={node.onPress ? handlePress : undefined}
      />
    </Animated.View>
  );
}

function RenderNode({
  node,
  nodes,
  map,
  isRoot = false,
}: {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
  isRoot?: boolean;
}) {
  switch (node.type) {
    case "View":
    case "ThemedView":
      return (
        <RenderViewNode node={node} nodes={nodes} map={map} isRoot={isRoot} />
      );
    case "Text":
      return <RenderTextNode node={node} nodes={nodes} map={map} />;
    case "Button":
      return <RenderButtonNode node={node} nodes={nodes} map={map} />;
    default:
      return null;
  }
}

// -------------------- Main Event-Based Renderer --------------------
export default function EventBasedRenderer({
  events = [],
}: {
  events?: SpaceEvent[];
}) {
  const [nodes, setNodes] = useState<Map<string, NodeState>>(new Map());
  const [rootId, setRootId] = useState<string | null>(null);
  const sharedValuesRef = useRef<SVMap>({});

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
          const next = new Map(prev);
          next.set(event.id, {
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
          });
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
            const newChildren = parent.children.filter(
              (id) => id !== event.childId
            );
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
              const newChildren = parent.children.filter(
                (id) => id !== event.id
              );
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

  // Process all events on mount and when events change
  useEffect(() => {
    if (!Array.isArray(events) || events.length === 0) {
      console.log("No events to process");
      return;
    }
    console.log("Processing", events.length, "events");
    events.forEach(processEvent);
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
    />
  );
}
