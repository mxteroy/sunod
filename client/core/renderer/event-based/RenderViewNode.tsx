import { ThemedView } from "@/components/ThemedView";
import { appleHoverInEasing } from "@/core/easings";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useAudioAppId } from "../../audio/AudioAppContext";
import { useResolvedStyleColors } from "../../theme/useResolvedSchemaColors";
import { useSplitAnimatedStyle } from "../styleSplitter";
import { executeHandler } from "./actions";
import { RenderNode } from "./RenderNode";
import type { RenderNodeProps } from "./types";

/**
 * Renders View and ThemedView nodes with gesture support
 * Handles children rendering and propagates context for template binding
 */
export function RenderViewNode({
  node,
  nodes,
  map,
  isRoot = false,
  store,
  itemContext,
  itemVar,
}: RenderNodeProps) {
  const themed = node.type === "ThemedView";
  const resolvedStyles = useResolvedStyleColors(node.style);
  const appId = useAudioAppId();

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
          executeHandler(node.onPanGestureStart, map, eventData, appId);
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
          executeHandler(node.onPanGestureChange, map, eventData, appId);
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
          executeHandler(node.onPanGestureEnd, map, eventData, appId);
        });
      }

      gestureList.push(pan);
    }

    if (node.onPress) {
      const tap = Gesture.Tap().onEnd(() => {
        "worklet";
        executeHandler(node.onPress, map, {}, appId);
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
    appId,
  ]);

  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Render children - handles both node IDs (regular) and inline objects (templates)
  const children = node.children.map((childIdOrNode, index) => {
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
          node={childIdOrNode}
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
      aStyle={aStyle as StyleProp<ViewStyle>}
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
      // exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
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
