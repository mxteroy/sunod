import { Button } from "@/components/button/Button";
import { appleHoverInEasing } from "@/core/easings";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useAudioAppId } from "../../audio/AudioAppContext";
import { useResolvedStyleColors } from "../../theme/useResolvedSchemaColors";
import { useSplitAnimatedStyle } from "../styleSplitter";
import { executeHandlerWithStore } from "./actions";
import { resolveTemplateString } from "./templateBinding";
import type { RenderNodeProps } from "./types";

/**
 * Renders Button nodes with action support and template string binding
 */
export function RenderButtonNode({
  node,
  map,
  store,
  itemContext,
  itemVar,
}: RenderNodeProps) {
  const appId = useAudioAppId();
  const resolvedStyles = useResolvedStyleColors(node.style);
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Resolve template strings in button text
  const resolvedText = useMemo(
    () => resolveTemplateString(node.text, itemContext, itemVar),
    [node.text, itemContext, itemVar]
  );

  const handlePress = () => {
    if (node.onPress) {
      // Use executeHandlerWithStore to support data actions
      // Pass itemContext and itemVar for template string resolution in actions
      executeHandlerWithStore(
        node.onPress,
        map,
        {},
        store,
        itemContext,
        itemVar,
        appId
      );
    }
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      // exiting={SlideOutDown.duration(250).easing(appleHoverOutEasing)}
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
