import { appleHoverInEasing } from "@/core/easings";
import { Selectable, SelectableState } from "@/core/Selectable";
import { useCallback, useMemo } from "react";
import { SlideInDown } from "react-native-reanimated";
import { useAudioAppId } from "../../audio/AudioAppContext";
import { useResolvedStyleColors } from "../../theme/useResolvedSchemaColors";
import { useSplitAnimatedStyle } from "../styleSplitter";
import { executeHandler, executeHandlerWithStore } from "./actions";
import { RenderNode } from "./RenderNode";
import { resolveTemplateString } from "./templateBinding";
import type { RenderNodeProps } from "./types";
import { useMeasureBindings } from "./useMeasureBindings";

/**
 * Helper to resolve template variables in a node object recursively
 */
function resolveNodeTemplates(
  obj: any,
  itemContext: any | undefined,
  itemVar: string | undefined
): any {
  if (!obj || !itemContext || !itemVar) return obj;

  if (typeof obj === "string") {
    return resolveTemplateString(obj, itemContext, itemVar);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveNodeTemplates(item, itemContext, itemVar));
  }

  if (typeof obj === "object") {
    const resolved: any = {};
    for (const key in obj) {
      resolved[key] = resolveNodeTemplates(obj[key], itemContext, itemVar);
    }
    return resolved;
  }

  return obj;
}

/**
 * Renders a Selectable node with interaction state tracking
 * Updates a shared value with the SelectableState (0=DEFAULT, 1=HOVERED, 2=PRESSED)
 */
export function RenderSelectableNode({
  node,
  nodes,
  map,
  store,
  itemContext,
  itemVar,
}: RenderNodeProps) {
  // Get appId from context
  const appId = useAudioAppId();

  // Resolve template variables in the node (including stateSharedValueId and style bindings)
  const resolvedNode = useMemo(
    () => resolveNodeTemplates(node, itemContext, itemVar),
    [node, itemContext, itemVar]
  );

  const resolvedStyles = useResolvedStyleColors(resolvedNode.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Set up measure bindings if any
  const measureRef = useMeasureBindings(resolvedNode, map);

  // Handle state changes on UI thread (worklet)
  const onSelectableStateChange_UI = useCallback(
    (state: SelectableState) => {
      "worklet";

      console.log("SelectableStateChange_UI:", state, "node:", resolvedNode.id);

      // Update shared value if specified
      if (resolvedNode.stateSharedValueId && map) {
        const sharedValue = map[resolvedNode.stateSharedValueId];
        if (sharedValue) {
          console.log(
            "Updating state shared value:",
            resolvedNode.stateSharedValueId,
            "to",
            state
          );
          sharedValue.value = state; // 0=DEFAULT, 1=HOVERED, 2=PRESSED
        }
      }

      // Execute onSelectableStateChange_UI actions if specified (worklet context)
      if (resolvedNode.onSelectableStateChange_UI && map) {
        console.log("Executing onSelectableStateChange_UI actions");
        const eventData = { state }; // Pass the state as event data
        // Execute actions on UI thread (worklet context)
        executeHandler(
          resolvedNode.onSelectableStateChange_UI,
          map,
          eventData,
          appId
        );
      }
    },
    [
      resolvedNode.id,
      resolvedNode.stateSharedValueId,
      resolvedNode.onSelectableStateChange_UI,
      map,
      appId,
    ]
  );

  // Handle state changes on JS thread
  const onSelectableStateChange = useCallback(
    (state: SelectableState) => {
      console.log("SelectableStateChange_JS:", state, "node:", resolvedNode.id);

      // Execute onSelectableStateChange actions if specified (JS thread context)
      if (resolvedNode.onSelectableStateChange) {
        console.log("Executing onSelectableStateChange actions on JS thread");
        const eventData = { state }; // Pass the state as event data
        executeHandlerWithStore(
          resolvedNode.onSelectableStateChange,
          map,
          eventData,
          store,
          itemContext,
          itemVar,
          appId
        );
      }
    },
    [
      resolvedNode.id,
      resolvedNode.onSelectableStateChange,
      map,
      store,
      itemContext,
      itemVar,
      appId,
    ]
  );

  // JS thread handlers
  const handlePressIn = useMemo(() => {
    if (!node.onPressIn) return undefined;
    return () => {
      executeHandlerWithStore(
        node.onPressIn,
        map,
        {},
        store,
        itemContext,
        itemVar,
        appId
      );
    };
  }, [node.onPressIn, map, store, itemContext, itemVar, appId]);

  const handlePressOut = useMemo(() => {
    if (!node.onPressOut) return undefined;
    return () => {
      executeHandlerWithStore(
        node.onPressOut,
        map,
        {},
        store,
        itemContext,
        itemVar,
        appId
      );
    };
  }, [node.onPressOut, map, store, itemContext, itemVar, appId]);

  const handlePress = useMemo(() => {
    if (!node.onPress) return undefined;
    return () => {
      executeHandlerWithStore(
        node.onPress,
        map,
        {},
        store,
        itemContext,
        itemVar,
        appId
      );
    };
  }, [node.onPress, map, store, itemContext, itemVar, appId]);

  const handleHoverIn = useMemo(() => {
    if (!node.onHoverIn) return undefined;
    return () => {
      executeHandlerWithStore(
        node.onHoverIn,
        map,
        {},
        store,
        itemContext,
        itemVar,
        appId
      );
    };
  }, [node.onHoverIn, map, store, itemContext, itemVar, appId]);

  const handleHoverOut = useMemo(() => {
    if (!node.onHoverOut) return undefined;
    return () => {
      executeHandlerWithStore(
        node.onHoverOut,
        map,
        {},
        store,
        itemContext,
        itemVar,
        appId
      );
    };
  }, [node.onHoverOut, map, store, itemContext, itemVar, appId]);

  // UI thread (worklet) handlers
  const handlePressIn_UI = useCallback(
    (event: any) => {
      "worklet";
      if (node.onPressIn_UI && map) {
        executeHandler(node.onPressIn_UI, map, event, appId);
      }
    },
    [node.onPressIn_UI, map, appId]
  );

  const handlePressOut_UI = useCallback(
    (event: any) => {
      "worklet";
      if (node.onPressOut_UI && map) {
        executeHandler(node.onPressOut_UI, map, event, appId);
      }
    },
    [node.onPressOut_UI, map, appId]
  );

  const handlePress_UI = useCallback(
    (event: any) => {
      "worklet";
      if (node.onPress_UI && map) {
        executeHandler(node.onPress_UI, map, event, appId);
      }
    },
    [node.onPress_UI, map, appId]
  );

  const handleHoverIn_UI = useCallback(
    (event: any) => {
      "worklet";
      if (node.onHoverIn_UI && map) {
        executeHandler(node.onHoverIn_UI, map, event, appId);
      }
    },
    [node.onHoverIn_UI, map, appId]
  );

  const handleHoverOut_UI = useCallback(
    (event: any) => {
      "worklet";
      if (node.onHoverOut_UI && map) {
        executeHandler(node.onHoverOut_UI, map, event, appId);
      }
    },
    [node.onHoverOut_UI, map, appId]
  );

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

  return (
    <Selectable
      ref={measureRef}
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      style={[staticStyle, aStyle]}
      disabled={node.disabled}
      // JS thread handlers (for data operations)
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onSelectableStateChange={onSelectableStateChange}
      // UI thread handlers (worklets - for animations)
      onPressIn_UI={node.onPressIn_UI ? handlePressIn_UI : undefined}
      onPressOut_UI={node.onPressOut_UI ? handlePressOut_UI : undefined}
      onPress_UI={node.onPress_UI ? handlePress_UI : undefined}
      onHoverIn_UI={node.onHoverIn_UI ? handleHoverIn_UI : undefined}
      onHoverOut_UI={node.onHoverOut_UI ? handleHoverOut_UI : undefined}
      onSelectableStateChange_UI={onSelectableStateChange_UI}
    >
      {children}
    </Selectable>
  );
}
