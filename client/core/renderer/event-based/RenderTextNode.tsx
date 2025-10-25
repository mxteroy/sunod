import { ThemedText } from "@/components/ThemedText";
import { appleHoverInEasing } from "@/core/easings";
import { useMemo } from "react";
import type { StyleProp } from "react-native";
import { TextStyle as RNTextStyle } from "react-native";
import AnimateableText from "react-native-animateable-text";
import Animated, {
  SlideInDown,
  useAnimatedProps,
} from "react-native-reanimated";
import { useResolvedTextStyleColors } from "../../theme/useResolvedSchemaColors";
import { useSplitAnimatedStyle } from "../styleSplitter";
import { resolveTemplateString } from "./templateBinding";
import type { RenderNodeProps } from "./types";

/**
 * Extracts shared value references from template strings like "BPM: {{bpm}}"
 * Returns array of shared value IDs that are referenced
 */
function extractSharedValueRefs(text: string | undefined): string[] {
  if (!text) return [];
  const regex = /\{\{([^}]+)\}\}/g;
  const refs: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const ref = match[1].trim();
    // Only include if it's not a template variable (doesn't contain '.')
    if (!ref.includes(".")) {
      refs.push(ref);
    }
  }
  return refs;
}

/**
 * Resolves template strings with shared values like "BPM: {{bpm}}"
 * This runs in a worklet and reads shared values reactively
 */
function resolveTemplateWithSharedValues(
  text: string,
  map: any,
  itemContext?: any,
  itemVar?: string
): string {
  "worklet";

  // First resolve item context templates like {{todo.title}}
  let resolved = text;
  if (itemContext && itemVar) {
    resolved = text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      if (trimmedPath.startsWith(`${itemVar}.`)) {
        const field = trimmedPath.substring(itemVar.length + 1);
        const value = itemContext[field];
        return value !== undefined ? String(value) : match;
      }
      return match;
    });
  }

  // Then resolve shared value references like {{bpm}} or {{volume*100}}
  resolved = resolved.replace(/\{\{([^}]+)\}\}/g, (match, ref) => {
    const trimmedRef = ref.trim();
    // Ternary/conditional support: {{isPlaying==0?▶ Play:⏸ Pause}}
    const ternaryMatch = trimmedRef.match(/^(.*?)\?(.*?):(.*)$/);
    if (ternaryMatch) {
      // Parse left side (condition), then/else values
      const [, conditionExpr, thenVal, elseVal] = ternaryMatch;
      // Only support ==, !=, >, <, >=, <= for now
      const condMatch = conditionExpr.match(
        /^(\w+)\s*(==|!=|>=|<=|>|<)\s*(\d+)$/
      );
      if (condMatch) {
        const [, svName, op, cmpVal] = condMatch;
        const sv = map[svName];
        const svValue = sv && sv.value !== undefined ? sv.value : 0;
        let result = false;
        switch (op) {
          case "==":
            result = svValue === Number(cmpVal);
            break;
          case "!=":
            result = svValue !== Number(cmpVal);
            break;
          case ">":
            result = svValue > Number(cmpVal);
            break;
          case "<":
            result = svValue < Number(cmpVal);
            break;
          case ">=":
            result = svValue >= Number(cmpVal);
            break;
          case "<=":
            result = svValue <= Number(cmpVal);
            break;
        }
        return result ? thenVal.trim() : elseVal.trim();
      }
      // Fallback: if cannot parse, return original
      return match;
    }

    // Check for multiplication syntax like "volume*100"
    const multiplyMatch = trimmedRef.match(/^(\w+)\s*\*\s*(\d+)$/);
    if (multiplyMatch) {
      const [, svName, multiplier] = multiplyMatch;
      const sv = map[svName];
      if (sv && sv.value !== undefined && typeof sv.value === "number") {
        return Math.round(sv.value * parseFloat(multiplier)).toString();
      }
      return match;
    }

    const sv = map[trimmedRef];
    if (sv && sv.value !== undefined) {
      const value = sv.value;
      // Format numbers nicely
      if (typeof value === "number") {
        // Round to nearest integer for display
        return Math.round(value).toString();
      }
      return String(value);
    }
    return match;
  });

  return resolved;
}

/**
 * Renders Text nodes with template string binding support
 * Supports both static templates ({{item.field}}) and reactive shared values ({{sharedValue}})
 */
export function RenderTextNode({
  node,
  map,
  itemContext,
  itemVar,
}: RenderNodeProps) {
  // Always resolve text style colors to concrete strings
  const resolvedStyles = useResolvedTextStyleColors(node.style);
  // Ensure color is a string for AnimateableText
  const resolvedColor =
    typeof resolvedStyles?.color === "string"
      ? resolvedStyles.color
      : undefined;
  const { staticStyle, aStyle } = useSplitAnimatedStyle(resolvedStyles, map);

  // Check if text contains shared value references
  const sharedValueRefs = useMemo(
    () => extractSharedValueRefs(node.text),
    [node.text]
  );

  const hasSharedValueRefs = sharedValueRefs.length > 0;

  // For static text (no shared values), resolve once
  const staticText = useMemo(
    () =>
      hasSharedValueRefs
        ? undefined
        : resolveTemplateString(node.text, itemContext, itemVar),
    [node.text, itemContext, itemVar, hasSharedValueRefs]
  );

  // For animated text (has shared values), use useAnimatedProps
  const animatedProps = useAnimatedProps(() => {
    "worklet";
    if (!hasSharedValueRefs || !node.text) {
      return { text: "" };
    }
    const resolved = resolveTemplateWithSharedValues(
      node.text,
      map,
      itemContext,
      itemVar
    );
    console.log("Resolved animated text:", resolved);
    return { text: resolved };
  });

  if (hasSharedValueRefs) {
    // Use AnimateableText with resolved color for reactive text
    return (
      <Animated.View
        entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
      >
        <AnimateableText
          animatedProps={animatedProps}
          editable={false}
          style={
            [
              { ...staticStyle, color: resolvedColor },
              aStyle,
            ] as StyleProp<RNTextStyle>
          }
        />
      </Animated.View>
    );
  }

  // Static text - use ThemedText
  return (
    <Animated.View
      entering={SlideInDown.duration(400).easing(appleHoverInEasing)}
    >
      <ThemedText
        aStyle={[aStyle as StyleProp<RNTextStyle>]}
        style={staticStyle as StyleProp<RNTextStyle>}
      >
        {staticText}
      </ThemedText>
    </Animated.View>
  );
}
