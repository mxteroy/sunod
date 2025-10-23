import React from "react";
import { RenderButtonNode } from "./RenderButtonNode";
import { RenderForNode } from "./RenderForNode";
import { RenderTextNode } from "./RenderTextNode";
import { RenderViewNode } from "./RenderViewNode";
import type { RenderNodeProps } from "./types";

/**
 * Main node router - dispatches to the appropriate renderer based on node type
 * Memoized to prevent unnecessary re-renders
 */
export const RenderNode = React.memo(
  function RenderNode({
    node,
    nodes,
    map,
    isRoot = false,
    store,
    itemContext,
    itemVar,
  }: RenderNodeProps) {
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
