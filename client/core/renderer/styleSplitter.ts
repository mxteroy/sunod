// renderer/styleSplit.ts
import type { Conditional, Expression, NumVal } from "@shared/schema";
import {
  type Style as SchemaStyle,
  type TextStyle as SchemaTextStyle,
} from "@shared/schema";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import type { SVMap } from "./Renderer";

// ---- tiny worklet-safe type guards ----
export const isBinding = (v: any): v is { bind: any } => {
  "worklet";
  return !!v && typeof v === "object" && "bind" in v;
};
const isSharedRef = (x: any): x is { type: "shared"; ref: string } => {
  "worklet";
  return !!x && x.type === "shared";
};
const isExpr = (x: any): x is Expression => {
  "worklet";
  return !!x && x.type === "expr";
};
const isCond = (x: any): x is Conditional => {
  "worklet";
  return !!x && x.type === "cond";
};

// ---- core numeric eval we already had (kept worklet-safe) ----
function getSVValue(map: SVMap, id: string): any {
  "worklet";
  const sv = map[id] as SharedValue<any> | undefined;
  return sv ? sv.value : undefined;
}
function toNumber(val: any): number {
  "worklet";
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}
function evalNumericSource(
  src: number | { type: "shared"; ref: string },
  map: SVMap
): number {
  "worklet";
  if (typeof src === "number") return src;
  if (isSharedRef(src)) return toNumber(getSVValue(map, src.ref));
  return 0;
}
function evalBinding(binding: any, map: SVMap): number {
  "worklet";
  if (isSharedRef(binding)) return toNumber(getSVValue(map, binding.ref));
  if (isExpr(binding)) {
    const { op, args } = binding;
    const vals: number[] = args.map((a: any) =>
      evalNumericSource(a as any, map)
    );
    switch (op) {
      case "add":
        return vals.reduce((a, b) => a + b, 0);
      case "sub":
        return vals.slice(1).reduce((a, b) => a - b, vals[0] ?? 0);
      case "mul":
        return vals.reduce((a, b) => a * b, 1);
      case "div":
        return vals
          .slice(1)
          .reduce((a, b) => a / (b === 0 ? 1 : b), vals[0] ?? 0);
      case "clamp": {
        const [x, min, max] = [vals[0] ?? 0, vals[1] ?? 0, vals[2] ?? 1];
        return Math.min(Math.max(x, min), max);
      }
      case "lerp": {
        const [a, b, t] = [vals[0] ?? 0, vals[1] ?? 0, vals[2] ?? 0];
        return a + (b - a) * t;
      }
      case "min":
        return Math.min(...vals);
      case "max":
        return Math.max(...vals);
    }
  }
  if (isCond(binding)) {
    const { left, op, right } = binding.if;
    const L = evalNumericSource(left as any, map);
    const R = evalNumericSource(right as any, map);
    const pass =
      op === ">"
        ? L > R
        : op === ">="
          ? L >= R
          : op === "<"
            ? L < R
            : op === "<="
              ? L <= R
              : op === "=="
                ? L === R
                : L !== R; // "!="
    return pass
      ? evalNumericSource(binding.then as any, map)
      : evalNumericSource(binding.else as any, map);
  }
  if (typeof binding === "number") return binding;
  return 0;
}

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
  if (isBinding(v)) return evalBinding(v.bind as any, map);
  return undefined;
}

// Keys that are numeric and can be animated
const NUMERIC_KEYS: (keyof SchemaStyle)[] = [
  "width",
  "height",
  "opacity",
  "borderRadius",
  "padding",
  "margin",
  "flex",
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

  // Non-animatable strings: keep static for now (backgroundColor may be theme/token/raw)
  if (style?.backgroundColor != null) {
    staticOut.backgroundColor = style.backgroundColor;
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

  // Non-animatable strings: keep static for now (backgroundColor may be theme/token/raw)
  if (style?.backgroundColor != null) {
    staticOut.backgroundColor = style.backgroundColor;
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
