import { ThemedView } from "@/components/ThemedView";
import { useMemo, useState } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { useResolvedStyleColors } from "../../theme/useResolvedSchemaColors";
import { useSplitAnimatedStyle } from "../styleSplitter";
import { RenderNode } from "./RenderNode";
import type { RenderNodeProps } from "./types";

/**
 * Renders Grid nodes - flexible grid layout using flexbox wrap
 * Calculates item widths based on columns prop
 */
export function RenderGridNode({
  node,
  nodes,
  map,
  store,
  itemContext,
  itemVar,
}: RenderNodeProps) {
  const resolvedStyles = useResolvedStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Calculate item width based on columns and container width
  const itemWidth = useMemo(() => {
    if (!node.columns || !containerWidth) return undefined;
    const gap = typeof node.gap === "number" ? node.gap : 0;
    // Calculate width: (containerWidth - (columns-1) * gap) / columns
    return (containerWidth - (node.columns - 1) * gap) / node.columns;
  }, [node.columns, node.gap, containerWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Render children with calculated widths
  const children = node.children?.map((childIdOrNode) => {
    if (typeof childIdOrNode === "string") {
      const childNode = nodes.get(childIdOrNode);
      if (!childNode) return null;

      // Apply width to each child if columns is specified
      const childWithWidth =
        node.columns && itemWidth
          ? {
              ...childNode,
              style: {
                ...childNode.style,
                width: itemWidth,
              },
            }
          : childNode;

      return (
        <RenderNode
          key={childIdOrNode}
          node={childWithWidth as any}
          nodes={nodes}
          map={map}
          isRoot={false}
          store={store}
          itemContext={itemContext}
          itemVar={itemVar}
        />
      );
    } else if (typeof childIdOrNode === "object" && childIdOrNode.id) {
      // Inline node object
      const childWithWidth =
        node.columns && itemWidth
          ? {
              ...childIdOrNode,
              style: {
                ...childIdOrNode.style,
                width: itemWidth,
              },
            }
          : childIdOrNode;

      return (
        <RenderNode
          key={childIdOrNode.id}
          node={childWithWidth as any}
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

  // Grid container uses flexWrap to create grid behavior
  const gridStyle: StyleProp<ViewStyle> = {
    ...staticStyle,
    flexDirection: "row",
    flexWrap: "wrap",
  };

  return (
    <ThemedView
      style={gridStyle as StyleProp<ViewStyle>}
      aStyle={aStyle as StyleProp<ViewStyle>}
      noTheme={true}
      onLayout={handleLayout}
    >
      {children}
    </ThemedView>
  );
}
