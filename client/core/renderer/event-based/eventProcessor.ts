import type { SpaceEvent } from "@shared/schema";
import { makeMutable, withTiming } from "react-native-reanimated";
import type { SVMap } from "../FullSchemaRenderer";
import type { NodeState } from "./types";

/**
 * Processes individual space events and updates the node tree
 * Handles createView, addChild, updateStyle, etc.
 */
export function createEventProcessor(
  setNodes: React.Dispatch<React.SetStateAction<Map<string, NodeState>>>,
  setRootId: React.Dispatch<React.SetStateAction<string | null>>,
  sharedValuesRef: React.MutableRefObject<SVMap>
) {
  return (event: SpaceEvent): void => {
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
          const processor = createEventProcessor(
            setNodes,
            setRootId,
            sharedValuesRef
          );
          event.events.forEach((e) => {
            processor(e);
          });
        }
        break;
      }
    }
  };
}
