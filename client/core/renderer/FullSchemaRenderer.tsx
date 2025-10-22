import { Button } from "@/components/button/Button";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  ThemedViewNode,
  zSpace,
  type Action,
  type ButtonNode,
  type SpaceDoc,
  type TextNode,
  type ViewNode,
} from "@shared/schema";
import React, { useEffect, useMemo } from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Easing,
  runOnUI,
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { sampleDoc } from "../sampleDoc";
import {
  useResolvedStyleColors,
  useResolvedTextStyleColors,
} from "../theme/useResolvedSchemaColors";
import { useSplitAnimatedStyle } from "./styleSplitter";

/** -----------------------------------------------------------------------
 *  Full Schema Renderer (Legacy)
 *  - Renders entire SpaceDoc at once
 *  - Simple and straightforward
 *  - Best for static UIs or initial prototyping
 *
 *  NOTE: Consider using EventBasedRenderer for:
 *  - Smaller payloads (90-99% reduction)
 *  - Smooth layout animations
 *  - Real-time collaboration
 *  - Progressive rendering
 * --------------------------------------------------------------------- */

/** Map id -> SharedValue<any> created from doc.sharedValues */
export type SVMap = Record<string, SharedValue<any>>;

function useBuildSVMap(doc: SpaceDoc): SVMap {
  const map: SVMap = {};
  for (const s of doc.sharedValues ?? []) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    map[s.id] = useSharedValue<any>(s.initial);
  }
  return map;
}

// Helper to evaluate a computed value (supports deep nesting)
function evalComputedValue(
  value: any,
  map: SVMap,
  eventData: Record<string, number>
): number {
  "worklet";
  if (typeof value === "number") return value;
  if (typeof value === "string") return eventData[value] ?? 0;

  // Handle shared ref
  if (value.type === "sharedRef") {
    const sv = map[value.ref];
    console.log("Evaluating sharedRef", value.ref, "value:", sv?.value);
    return sv ? (typeof sv.value === "number" ? sv.value : 0) : 0;
  }

  // Handle computed value (recursive)
  if (value.type === "computed") {
    // Recursively evaluate each argument
    const args = value.args.map((arg: any) => {
      // Each arg can be a number, string, sharedRef, or another computed value
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

// Helper to execute a single action
function executeAction(
  action: Action,
  map: SVMap,
  eventData: Record<string, number>
) {
  "worklet";

  switch (action.type) {
    case "setSharedValue": {
      const target = map[action.target];
      if (!target) {
        console.warn(`Shared value "${action.target}" not found`);
        return;
      }

      // Evaluate the value
      const computedValue = evalComputedValue(action.value, map, eventData);

      // Apply the operation
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

      console.log("Setting shared value", action.target, "to", target.value);
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
      if (!target) {
        console.warn(`Shared value "${action.target}" not found`);
        return;
      }

      const toValue = evalComputedValue(action.to, map, eventData);
      const duration = action.duration || 300;
      console.log(
        "Animating",
        action.target,
        "action.to",
        action.to,
        "to",
        toValue,
        "over",
        duration,
        "ms"
      );

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
          // For spring, we'd need withSpring instead of withTiming
          target.value = withTiming(toValue, { duration: duration / 2 });
          return;
      }

      target.value = withTiming(toValue, { duration, easing });
      break;
    }

    case "delay": {
      // Note: delay in worklets is tricky - this schedules the next action
      // In practice, you'd need to chain actions with withDelay
      console.log(
        `Delay of ${action.duration}ms requested (not fully implemented in worklet)`
      );
      break;
    }
  }
}

// Helper to execute action handler (array of actions)
function executeHandler(
  handler: Action[],
  map: SVMap,
  eventData: Record<string, number>
) {
  "worklet";

  for (const action of handler) {
    executeAction(action, map, eventData);
  }
}

// -------------------- View & ThemedView --------------------
function RenderView({
  node,
  map,
  themed = false,
}: {
  node: ViewNode | ThemedViewNode;
  map: SVMap;
  themed?: boolean;
}) {
  const resolvedStyles = useResolvedStyleColors(node.style);
  console.log("node id:", node.id);

  // Create gestures based on node configuration
  const gestures = useMemo(() => {
    const gestureList = [];

    // Pan gesture
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
          executeHandler(node.onPanGestureStart!, map, eventData);
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

          executeHandler(node.onPanGestureChange!, map, eventData);
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
          executeHandler(node.onPanGestureEnd!, map, eventData);
        });
      }

      gestureList.push(pan);
    }

    // Tap gesture for onPress
    if (node.onPress) {
      const tap = Gesture.Tap().onEnd(() => {
        "worklet";
        executeHandler(node.onPress!, map, {});
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

  const children = (node.children ?? []).map((c) => (
    <RenderNode key={c.id} node={c as any} map={map} />
  ));

  const ViewBody = (
    <ThemedView
      style={staticStyle as StyleProp<ViewStyle>}
      {...(themed ? { aStyle: aStyle as StyleProp<ViewStyle> } : {})}
      noTheme={!themed}
    >
      {children}
    </ThemedView>
  );

  return gestures ? (
    <GestureDetector gesture={gestures}>{ViewBody}</GestureDetector>
  ) : (
    ViewBody
  );
}

// -------------------- Text --------------------
function RenderText({ node, map }: { node: TextNode; map: SVMap }) {
  const resolvedStyles = useResolvedTextStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);
  return (
    <ThemedText
      aStyle={[aStyle as StyleProp<TextStyle>]}
      style={staticStyle as StyleProp<TextStyle>}
    >
      {node.text}
    </ThemedText>
  );
}

// -------------------- Button --------------------
function RenderButton({ node, map }: { node: ButtonNode; map: SVMap }) {
  const resolvedStyles = useResolvedStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  const handlePress = () => {
    if (node.onPress) {
      // Execute handler on UI thread
      runOnUI(() => {
        "worklet";
        executeHandler(node.onPress!, map, {});
      })();
    }
  };

  return (
    <Button
      title={node.text}
      style={staticStyle as StyleProp<ViewStyle>}
      aStyle={aStyle as StyleProp<ViewStyle>}
      onPress={node.onPress ? handlePress : undefined}
    />
  );
}

export function RenderNode({
  node,
  map,
}: {
  node: ViewNode | TextNode | ButtonNode | ThemedViewNode;
  map: SVMap;
}) {
  useEffect(() => {
    console.log("Rendering node:", node.id);
  }, [node.id]);
  switch (node.type) {
    case "View":
      console.log("Rendering View node:", node.id);
      return <RenderView node={node as ViewNode} map={map} />;
    case "ThemedView":
      console.log("Rendering ThemedView node:", node.id);
      return <RenderView node={node as ThemedViewNode} map={map} themed />;
    case "Text":
      console.log("Rendering Text node:", node.id);
      return <RenderText node={node as TextNode} map={map} />;
    case "Button":
      console.log("Rendering Button node:", node.id);
      return <RenderButton node={node as ButtonNode} map={map} />;
    default:
      return null;
  }
}

/**
 * Full Schema Renderer (Legacy)
 *
 * Renders the entire SpaceDoc at once. Simple but sends large payloads.
 *
 * @deprecated Consider using EventBasedRenderer for better performance
 * @see EventBasedRenderer for incremental updates and smooth animations
 */
export default function FullSchemaRenderer({
  doc = sampleDoc,
}: {
  doc: SpaceDoc | undefined;
}) {
  const map = useBuildSVMap(doc);
  zSpace.parse(doc); // for type checking
  console.log("FullSchemaRenderer render complete");
  return <RenderNode node={doc.root} map={map} />;
}

// Legacy export alias for backwards compatibility
export { FullSchemaRenderer as SpaceRenderer };
// You can update any SharedValue from the outside, e.g. via a button or effect:
// const map = ... (exposed via a ref or lifted state if you adapt buildSVMap)
// map["opacity"].value = 0.5

// Event handlers: nodes with onPanGestureChange or onPress will automatically
// create gesture handlers that modify shared values based on the configured operations.
