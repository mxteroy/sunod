import { appleHoverInEasing, appleHoverOutEasing } from "@/core/easings";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import type { SpaceStore } from "../../store";
import { useResolvedStyleColors } from "../../theme/useResolvedSchemaColors";
import { useSplitAnimatedStyle } from "../styleSplitter";
import { RenderNode } from "./RenderNode";
import type { RenderNodeProps } from "./types";

/**
 * Renders For nodes (lists) with collection data binding
 * Uses FlashList for optimized rendering of large lists
 */
export function RenderForNode({
  node,
  nodes,
  map,
  store,
}: Required<Pick<RenderNodeProps, "node" | "nodes" | "map" | "store">>) {
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

      // Pass item context to template for data binding
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
