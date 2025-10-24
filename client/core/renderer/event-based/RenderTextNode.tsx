import { ThemedText } from "@/components/ThemedText";
import { appleHoverInEasing } from "@/core/easings";
import { useMemo } from "react";
import type { StyleProp } from "react-native";
import { TextStyle as RNTextStyle } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useResolvedTextStyleColors } from "../../theme/useResolvedSchemaColors";
import { useSplitAnimatedStyle } from "../styleSplitter";
import { resolveTemplateString } from "./templateBinding";
import type { RenderNodeProps } from "./types";

/**
 * Renders Text nodes with template string binding support
 */
export function RenderTextNode({
  node,
  map,
  itemContext,
  itemVar,
}: RenderNodeProps) {
  const resolvedStyles = useResolvedTextStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Resolve template strings like {{todo.title}}
  const resolvedText = useMemo(
    () => resolveTemplateString(node.text, itemContext, itemVar),
    [node.text, itemContext, itemVar]
  );

  console.log("resolvedText", resolvedText);

  return (
    <Animated.View
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      // exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
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
