// renderer/useResolvedSchemaColors.ts
import { useResolveColorInput } from "@/core/theme/useResolveColorInput";
import type {
  Style as SchemaStyle,
  TextStyle as SchemaTextStyle,
} from "@shared/schema";
import { useMemo } from "react";

/**
 * Returns a NEW style object with any ColorInput fields resolved to strings.
 * IMPORTANT: This hook stays “static”—no SV reads or animations here.
 */
export function useResolvedStyleColors(style?: SchemaStyle) {
  // Currently only backgroundColor is a ColorInput on zStyle
  const bg = useResolveColorInput(style?.backgroundColor);

  // Build once (avoid changing object identity if values didn’t change)
  return useMemo(() => {
    if (!style) return style;

    // shallow copy is fine; only backgroundColor changes
    const out: SchemaStyle = { ...style };
    if (style.backgroundColor !== undefined) {
      // @ts-ignore - we know this becomes a plain string now
      out.backgroundColor = bg;
    }
    return out;
  }, [style, bg]);
}

export function useResolvedTextStyleColors(style?: SchemaTextStyle) {
  // Currently only backgroundColor is a ColorInput on zStyle
  const bg = useResolveColorInput(style?.backgroundColor);

  // Build once (avoid changing object identity if values didn’t change)
  return useMemo(() => {
    if (!style) return style;

    // shallow copy is fine; only backgroundColor changes
    const out: SchemaTextStyle = { ...style };
    if (style.backgroundColor !== undefined) {
      // @ts-ignore - we know this becomes a plain string now
      out.backgroundColor = bg;
    }
    return out;
  }, [style, bg]);
}
