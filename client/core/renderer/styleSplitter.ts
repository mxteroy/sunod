// renderer/styleSplit.ts
import type {
  NumVal,
  Style as SchemaStyle,
  TextStyle as SchemaTextStyle,
} from "@shared/schema";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { useAnimatedStyle } from "react-native-reanimated";
import { evalComputedValue } from "./event-based/actions";
import type { SVMap } from "./FullSchemaRenderer";

// ---- tiny worklet-safe type guards ----
export const isBinding = (v: any): v is { bind: any } => {
  "worklet";
  return !!v && typeof v === "object" && "bind" in v;
};

export function isNumValAnimated(v: NumVal | undefined): boolean {
  "worklet";
  return !!v && typeof v === "object" && isBinding(v);
}

export function readNumVal(
  v: NumVal | undefined,
  map: SVMap
): number | undefined {
  "worklet";
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  if (isBinding(v)) {
    // Use evalComputedValue which handles type: "computed" (not just "expr")
    const result = evalComputedValue(v.bind as any, map, {});
    return typeof result === "number" ? result : undefined;
  }
  return undefined;
}

// Keys that are numeric and can be animated
const NUMERIC_KEYS: (keyof SchemaStyle)[] = [
  "width",
  "height",
  "opacity",
  "borderRadius",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "margin",
  "marginBottom",
  "marginTop",
  "marginLeft",
  "marginRight",
  "gap",
  "flex",
];

// Non-animated string/enum properties
const STATIC_STRING_KEYS: (keyof SchemaStyle)[] = [
  "flexDirection",
  "alignItems",
  "justifyContent",
];

// Returns two style objects you can spread in your component style prop.
export function splitSchemaStyle(
  style: SchemaStyle | undefined,
  map: SVMap,
  print: boolean = false
): {
  staticStyle: StyleProp<ViewStyle | TextStyle>;
  animatedComputer: () => ViewStyle | TextStyle; // worklet for useAnimatedStyle
  hasAnimated: boolean;
} {
  // non-worklet static object (resolved NOW, no SV reads)
  const staticOut: any = {};
  let hasAnimated = false;

  // Numeric props: send literal numbers to static, bindings to animated
  const animatedNumeric: Record<string, NumVal | undefined> = {};
  for (const k of NUMERIC_KEYS) {
    // @ts-ignore
    const v = style?.[k] as NumVal | undefined;
    if (isNumValAnimated(v)) {
      animatedNumeric[k as string] = v;
      hasAnimated = true;
    } else if (typeof v === "number") {
      staticOut[k] = v;
    }
  }

  // backgroundColor: check if it's a binding (animated) or static
  let animatedBgColor: any = undefined;
  if (style?.backgroundColor != null) {
    const bgColor = style.backgroundColor;
    if (isBinding(bgColor)) {
      // It's animated - will be handled in animatedComputer
      animatedBgColor = bgColor;
      hasAnimated = true;
    } else {
      // Static color string
      staticOut.backgroundColor = bgColor;
    }
  }

  // Static string/enum properties (flexDirection, alignItems, justifyContent, etc.)
  for (const k of STATIC_STRING_KEYS) {
    // @ts-ignore
    const v = style?.[k];
    if (v != null) {
      staticOut[k] = v;
    }
  }

  // Transform: split per-property
  const staticTransforms: any[] = [];
  const animatedTransforms: {
    key: string;
    value: NumVal | string | undefined;
  }[] = [];

  if (style?.transform) {
    const t = style.transform;
    const pushNum = (key: string, v?: NumVal, fallback?: number) => {
      if (v == null) return;
      if (isNumValAnimated(v)) {
        animatedTransforms.push({ key, value: v });
        if (print) {
          console.log("found animated transform:", key, v);
        }
        hasAnimated = true;
      } else if (typeof v === "number") {
        staticTransforms.push({ [key]: v });
      } else if (fallback != null) {
        staticTransforms.push({ [key]: fallback });
      }
    };

    pushNum("translateX", t.translateX, 0);
    pushNum("translateY", t.translateY, 0);
    pushNum("scale", t.scale, 1);
    pushNum("scaleX", t.scaleX, 1);
    pushNum("scaleY", t.scaleY, 1);

    // string rotations are static in current schema
    if (t.rotate) staticTransforms.push({ rotate: t.rotate });
    if (t.rotateX) staticTransforms.push({ rotateX: t.rotateX });
    if (t.rotateY) staticTransforms.push({ rotateY: t.rotateY });
  }
  if (staticTransforms.length) staticOut.transform = staticTransforms;

  // Worklet computer: ONLY reads shared/expr values for animated parts
  const animatedComputer = () => {
    "worklet";
    const out: any = {};

    // numeric props
    for (const [k, v] of Object.entries(animatedNumeric)) {
      const num = readNumVal(v as NumVal | undefined, map);
      if (num != null) out[k] = num;
    }

    // backgroundColor: evaluate if animated
    if (animatedBgColor) {
      const computed = animatedBgColor.bind;
      if (computed) {
        const color = evalComputedValue(computed, map, {});
        if (color != null) out.backgroundColor = color;
      }
    }

    // transforms
    if (animatedTransforms.length) {
      out.transform = animatedTransforms.map(({ key, value }) => {
        if (typeof value === "string") {
          // (not used right now, kept for completeness)
          // @ts-ignore
          return { [key]: value };
        } else {
          // @ts-ignore
          return {
            [key]:
              readNumVal(value as NumVal | undefined, map) ??
              (key.startsWith("scale") ? 1 : 0),
          };
        }
      });
    }

    if (print) {
      console.log("Static style:", staticOut);
      console.log("Animated style:", out);
    }
    return out as ViewStyle | TextStyle;
  };

  return { staticStyle: staticOut, animatedComputer, hasAnimated };
}

/** ----------------------------- Worklet eval ----------------------------- */

export function useSplitAnimatedStyle(
  style: SchemaStyle | SchemaTextStyle | undefined,
  map: SVMap,
  print: boolean = false
) {
  // Extract the static parts and metadata about what needs to be animated
  // non-worklet static object (resolved NOW, no SV reads)
  const staticOut: any = {};
  let hasAnimated = false;

  // Numeric props: send literal numbers to static, bindings to animated
  const animatedNumeric: Record<string, NumVal | undefined> = {};
  for (const k of NUMERIC_KEYS) {
    // @ts-ignore
    const v = style?.[k] as NumVal | undefined;
    if (isNumValAnimated(v)) {
      animatedNumeric[k as string] = v;
      hasAnimated = true;
    } else if (typeof v === "number") {
      staticOut[k] = v;
    }
  }

  // backgroundColor: check if it's a binding (animated) or static
  let animatedBgColor: any = undefined;
  if (style?.backgroundColor != null) {
    const bgColor = style.backgroundColor;
    if (isBinding(bgColor)) {
      // It's animated - will be handled in useAnimatedStyle
      animatedBgColor = bgColor;
      hasAnimated = true;
    } else {
      // Static color string
      staticOut.backgroundColor = bgColor;
    }
  }

  // Static string/enum properties (flexDirection, alignItems, justifyContent, etc.)
  for (const k of STATIC_STRING_KEYS) {
    // @ts-ignore
    const v = style?.[k];
    if (v != null) {
      staticOut[k] = v;
    }
  }

  // Transform: split per-property
  const staticTransforms: any[] = [];
  const animatedTransforms: {
    key: string;
    value: NumVal | string | undefined;
  }[] = [];

  if (style?.transform) {
    const t = style.transform;
    const pushNum = (key: string, v?: NumVal, fallback?: number) => {
      if (v == null) return;
      if (isNumValAnimated(v)) {
        animatedTransforms.push({ key, value: v });
        hasAnimated = true;
      } else if (typeof v === "number") {
        staticTransforms.push({ [key]: v });
      } else if (fallback != null) {
        staticTransforms.push({ [key]: fallback });
      }
    };

    pushNum("translateX", t.translateX, 0);
    pushNum("translateY", t.translateY, 0);
    pushNum("scale", t.scale, 1);
    pushNum("scaleX", t.scaleX, 1);
    pushNum("scaleY", t.scaleY, 1);

    // string rotations are static in current schema
    if (t.rotate) staticTransforms.push({ rotate: t.rotate });
    if (t.rotateX) staticTransforms.push({ rotateX: t.rotateX });
    if (t.rotateY) staticTransforms.push({ rotateY: t.rotateY });
  }
  if (staticTransforms.length) staticOut.transform = staticTransforms;

  // NOW create the animated style with ALL the logic inside the worklet.
  // Reactivity only works when the worklet that's directly passed to useAnimatedStyle reads SharedValues inside it.
  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const out: any = {};

    if (print) {
      console.log("=== Animated style worklet running ===");
      console.log("animatedNumeric keys:", Object.keys(animatedNumeric));
      console.log("animatedTransforms:", animatedTransforms);
    }

    // numeric props - read SharedValues HERE in the worklet
    for (const [k, v] of Object.entries(animatedNumeric)) {
      const num = readNumVal(v as NumVal | undefined, map);
      if (print) {
        console.log(`Reading ${k}:`, v, "->", num);
      }
      if (num != null) out[k] = num;
    }

    // backgroundColor: evaluate if animated
    if (animatedBgColor) {
      const computed = animatedBgColor.bind;
      if (computed) {
        const color = evalComputedValue(computed, map, {});
        if (print) {
          console.log(`Reading backgroundColor:`, computed, "->", color);
        }
        if (color != null) out.backgroundColor = color;
      }
    }

    // transforms - read SharedValues HERE in the worklet
    if (animatedTransforms.length) {
      out.transform = animatedTransforms.map(({ key, value }) => {
        if (typeof value === "string") {
          // @ts-ignore
          return { [key]: value };
        } else {
          const num =
            readNumVal(value as NumVal | undefined, map) ??
            (key.startsWith("scale") ? 1 : 0);
          if (print) {
            console.log(`Reading transform ${key}:`, value, "->", num);
          }
          // @ts-ignore
          return { [key]: num };
        }
      });
    }

    if (print) {
      console.log("Final animated style:", out);
    }
    return out as ViewStyle | TextStyle;
  });

  const aStyle = hasAnimated ? animatedStyle : undefined;

  return { staticStyle: staticOut, aStyle };
}
