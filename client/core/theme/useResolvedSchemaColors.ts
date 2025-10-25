// renderer/useResolvedSchemaColors.ts
import { useResolveColorInput } from "@/core/theme/useResolveColorInput";
import type {
  Style as SchemaStyle,
  TextStyle as SchemaTextStyle,
} from "@shared/schema";
import { useMemo } from "react";

/**
 * Helper to check if a value is a binding object
 */
const isBinding = (v: any): v is { bind: any } =>
  !!v && typeof v === "object" && "bind" in v;

/**
 * Returns a NEW style object with any ColorInput fields resolved to strings.
 * IMPORTANT: This hook stays "static"—no SV reads or animations here.
 */
export function useResolvedStyleColors(style?: SchemaStyle) {
  // Currently only backgroundColor is a ColorInput on zStyle
  const bgInput = style?.backgroundColor;

  // Extract colors from binding if needed (at top level, before any callbacks)
  const extractedColors = useMemo(() => {
    if (!isBinding(bgInput)) return [];

    const computed = bgInput.bind;
    if (computed?.type === "computed" && computed.op === "interpolateColor") {
      const colorRange = computed.args?.[2];
      if (Array.isArray(colorRange)) {
        return colorRange.filter(
          (c: any) =>
            typeof c === "object" &&
            (c?.type === "theme" || c?.type === "override")
        );
      }
    }

    return [];
  }, [bgInput]);

  // Resolve all extracted colors at the top level (before any useMemo)
  const resolvedColor0 = useResolveColorInput(extractedColors[0]);
  const resolvedColor1 = useResolveColorInput(extractedColors[1]);
  const resolvedColor2 = useResolveColorInput(extractedColors[2]);
  const resolvedColor3 = useResolveColorInput(extractedColors[3]);

  // Resolve direct color
  const bg = useResolveColorInput(
    bgInput && !isBinding(bgInput) ? bgInput : undefined
  );

  // Build once (avoid changing object identity if values didn't change)
  return useMemo(() => {
    if (!style) return style;

    // shallow copy is fine; only backgroundColor changes
    const out: SchemaStyle = { ...style };
    if (style.backgroundColor !== undefined) {
      if (isBinding(bgInput)) {
        const computed = bgInput.bind;

        // If it's interpolateColor, replace colors with resolved values
        if (
          computed?.type === "computed" &&
          computed.op === "interpolateColor"
        ) {
          const colorRange = computed.args?.[2];
          if (Array.isArray(colorRange)) {
            const resolvedValues = [
              resolvedColor0,
              resolvedColor1,
              resolvedColor2,
              resolvedColor3,
            ];
            let colorIndex = 0;

            const resolvedColors = colorRange.map((c: any) => {
              // For string colors, return as-is
              if (typeof c === "string") return c;
              // For theme refs, use the resolved value
              if (c?.type === "theme" || c?.type === "override") {
                return resolvedValues[colorIndex++] || c;
              }
              return c;
            });

            // @ts-ignore
            out.backgroundColor = {
              bind: {
                ...computed,
                args: [computed.args[0], computed.args[1], resolvedColors],
              },
            };
          } else {
            // @ts-ignore
            out.backgroundColor = bgInput;
          }
        } else {
          // @ts-ignore
          out.backgroundColor = bgInput;
        }
      } else {
        // @ts-ignore - we know this becomes a plain string now
        out.backgroundColor = bg;
      }
    }
    return out;
  }, [
    style,
    bg,
    bgInput,
    resolvedColor0,
    resolvedColor1,
    resolvedColor2,
    resolvedColor3,
  ]);
}

export function useResolvedTextStyleColors(style?: SchemaTextStyle) {
  // Resolve both color and backgroundColor
  const resolvedColor = useResolveColorInput(style?.color);
  const resolvedBg = useResolveColorInput(style?.backgroundColor);

  // Build once (avoid changing object identity if values didn’t change)
  return useMemo(() => {
    if (!style) return style;

    // shallow copy is fine; only color/backgroundColor changes
    const out: SchemaTextStyle = { ...style };
    if (style.color !== undefined) {
      // @ts-ignore - we know this becomes a plain string now
      out.color = resolvedColor;
    }
    if (style.backgroundColor !== undefined) {
      // @ts-ignore - we know this becomes a plain string now
      out.backgroundColor = resolvedBg;
    }
    return out;
  }, [style, resolvedColor, resolvedBg]);
}
