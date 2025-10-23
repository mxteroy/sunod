// schema/view.ts
import { z } from "zod";

/** ── primitives ─────────────────────────────────────────────────────────── */
export const zSharedType = z.enum(["number", "string", "boolean"]);
export const zSharedValue = z.object({
  id: z.string(),
  t: zSharedType,
  initial: z.union([z.number(), z.string(), z.boolean()]),
});

export const zSharedRef = z.object({
  type: z.literal("shared"),
  ref: z.string(),
});

/** Computed value argument: can be a number, event param, shared ref, or another computed value */
export const zComputedValueArg: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.number(), // literal number
    z.string(), // event parameter name (e.g., "changeX")
    z.object({
      type: z.literal("sharedRef"),
      ref: z.string(), // reference to another shared value
    }),
    zComputedValue, // nested computed value!
  ])
);

/** Computed value: can reference other shared values and perform operations */
export const zComputedValue: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("computed"),
    op: z.enum(["add", "sub", "mul", "div", "clamp", "lerp", "min", "max"]),
    args: z.array(zComputedValueArg),
  })
);

/** Event modifier value: can be a number, event param name, sharedRef, or computed value */
export const zEventModifierValue = z.union([
  z.string(), // event param name like "changeX"
  z.number(), // literal number
  z.object({ type: z.literal("sharedRef"), ref: z.string() }), // shared value reference
  zComputedValue, // computed from other shared values
]);

// ── Action-Based Event System ────────────────────────────────────────

/** Action: SetSharedValue - Updates a shared value */
export const zSetSharedValueAction = z.object({
  type: z.literal("setSharedValue"),
  target: z.string(), // shared value ID
  operation: z.enum(["set", "add", "sub", "mul", "div"]),
  value: zEventModifierValue, // can be computed, event param, or literal
});

/** Action: Log - Console logging for debugging */
export const zLogAction = z.object({
  type: z.literal("log"),
  message: z.string().optional(),
  values: z
    .array(
      z.union([
        z.string(), // literal string or event param name
        z.number(), // literal number
        z.object({ type: z.literal("sharedRef"), ref: z.string() }), // shared value
      ])
    )
    .optional(),
});

/** Action: Conditional - Execute actions based on a condition */
export const zConditionalAction: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("conditional"),
    condition: z.object({
      left: zEventModifierValue,
      op: z.enum([">", ">=", "<", "<=", "==", "!="]),
      right: zEventModifierValue,
    }),
    then: z.array(zAction), // actions to run if true
    else: z.array(zAction).optional(), // actions to run if false
  })
);

/** Action: Delay - Wait before executing next actions */
export const zDelayAction = z.object({
  type: z.literal("delay"),
  duration: z.number(), // milliseconds
});

/** Action: Animate - Animate a shared value change */
export const zAnimateAction = z.object({
  type: z.literal("animate"),
  target: z.string(), // shared value ID
  to: zEventModifierValue, // target value
  duration: z.number().optional(), // milliseconds (default 300)
  easing: z
    .enum(["linear", "easeIn", "easeOut", "easeInOut", "spring"])
    .optional(),
});

/** Action: CreateRecord - Add a new record to a collection */
export const zCreateRecordAction = z.object({
  type: z.literal("createRecord"),
  collection: z.string(), // collection key (e.g., "todos")
  record: z.any(), // record data (will be validated against collection shape)
});

/** Action: UpdateRecord - Update an existing record */
export const zUpdateRecordAction = z.object({
  type: z.literal("updateRecord"),
  collection: z.string(),
  id: z.string(), // record ID (can be a binding or literal)
  patch: z.any(), // partial update
});

/** Action: DeleteRecord - Delete a record from a collection */
export const zDeleteRecordAction = z.object({
  type: z.literal("deleteRecord"),
  collection: z.string(),
  id: z.string(), // record ID
});

/** Union of all action types */
export const zAction: z.ZodType<any> = z.lazy(() =>
  z.union([
    zSetSharedValueAction,
    zLogAction,
    zConditionalAction,
    zDelayAction,
    zAnimateAction,
    zCreateRecordAction,
    zUpdateRecordAction,
    zDeleteRecordAction,
  ])
);

/** Action handler: array of actions to execute */
export const zActionHandler = z.array(zAction);

/** Optional color override: { light?: "#fff", dark?: "#000" } */
export const zColorOverride = z.object({
  light: z.string().optional(),
  dark: z.string().optional(),
});

/** Theme token name — matches keys in your ColorPalette */
export const zThemeColorName = z.enum([
  "primary",
  "secondary",
  "accent",
  "background",
  "text",
  "surface",
  "icon",
  "placeholder",
  "bubble",
  "primaryHover",
  "secondaryHover",
  "accentHover",
  "surfaceHover",
]);

/** Theme color reference: { type: "theme", name: "primary" } */
export const zColorRef = z.object({
  type: z.literal("theme"),
  name: zThemeColorName,
});

/** A color value can be a theme ref, a light/dark override, or a raw string */
export const zColorInput = z.union([zColorRef, zColorOverride, z.string()]);

// ───────────────────────────────────────────────────────────────────────────

type NumericSource =
  | z.infer<typeof zSharedRef>
  | number
  | Expression
  | Conditional;

export const zNumericSource: z.ZodType<NumericSource> = z.lazy(() =>
  z.union([z.number(), zSharedRef, zExpression, zConditional])
);

export const zExpression: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("expr"),
    op: z.enum(["add", "sub", "mul", "div", "clamp", "lerp", "min", "max"]),
    args: z.array(zNumericSource).min(1),
  })
);

export const zConditional: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("cond"),
    if: z.object({
      left: zNumericSource,
      op: z.enum([">", ">=", "<", "<=", "==", "!="]),
      right: zNumericSource,
    }),
    then: zNumericSource,
    else: zNumericSource,
  })
);

export const zBindingNum = z.object({
  bind: z.union([zSharedRef, zExpression, zConditional]),
});

export const zNumVal = z.union([z.number(), zBindingNum]);
export const zStrVal = z.string(); // keep for non-color strings like rotate

/** ── style & view ───────────────────────────────────────────────────────── */
export const zTransform = z.object({
  translateX: zNumVal.optional(),
  translateY: zNumVal.optional(),
  scale: zNumVal.optional(),
  scaleX: zNumVal.optional(),
  scaleY: zNumVal.optional(),
  rotate: zStrVal.optional(),
  rotateX: zStrVal.optional(),
  rotateY: zStrVal.optional(),
});

/** NOTE: backgroundColor now uses zColorInput (token | override | string) */
export const zStyle = z.object({
  width: zNumVal.optional(),
  height: zNumVal.optional(),
  opacity: zNumVal.optional(),
  backgroundColor: zColorInput.optional(), // ← updated
  borderRadius: zNumVal.optional(),
  padding: zNumVal.optional(),
  margin: zNumVal.optional(),
  flex: zNumVal.optional(),
  transform: zTransform.optional(),
});

export const zTextStyle = zStyle.extend({
  fontSize: zNumVal.optional(),
  fontWeight: zNumVal.optional(),
  lineHeight: zNumVal.optional(),
  letterSpacing: zNumVal.optional(),
  color: zColorInput.optional(),
});

/** ── concrete nodes ─────────────────────────────────────────────────────── */
export const zView = z.object({
  type: z.literal("View"),
  id: z.string(),
  style: zStyle.optional(),
  children: z.array(z.lazy(() => zNode)).optional(),
  onPanGestureStart: zActionHandler.optional(),
  onPanGestureChange: zActionHandler.optional(),
  onPanGestureEnd: zActionHandler.optional(),
  onPress: zActionHandler.optional(),
});

// Contains a backgroundColor
export const zThemedView = z.object({
  type: z.literal("ThemedView"),
  id: z.string(),
  style: zStyle.optional(),
  children: z.array(z.lazy(() => zNode)).optional(),
  onPanGestureStart: zActionHandler.optional(),
  onPanGestureChange: zActionHandler.optional(),
  onPanGestureEnd: zActionHandler.optional(),
  onPress: zActionHandler.optional(),
});

/** Text props extended earlier; color now accepts zColorInput */
export const zTextProps = z.object({
  variant: z
    .enum(["display", "h1", "h2", "title", "body", "label"])
    .default("body"),
  align: z.enum(["auto", "left", "right", "center", "justify"]).optional(),
  uppercase: z.boolean().optional(),
  muted: z.boolean().optional(),
  color: zColorInput.optional(), // ← updated (was zColorOverride)
  fontFamily: z.string().optional(),
});

export const zText = z.object({
  type: z.literal("Text"),
  id: z.string(),
  text: z.string(),
  style: zTextStyle.optional(),
  props: zTextProps.optional(),
});

/** Button props colors/textColors now accept zColorInput */
export const zButtonProps = z.object({
  variant: z
    .enum(["primary", "secondary", "accent", "ghost"])
    .default("primary"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  disabled: z.boolean().optional(),
  loading: z.boolean().optional(),
  colors: zColorInput.optional(), // ← updated
  textColors: zColorInput.optional(), // ← updated
  leftIcon: z
    .object({ name: z.string(), size: z.number().optional() })
    .optional(),
  rightIcon: z
    .object({ name: z.string(), size: z.number().optional() })
    .optional(),
  fullWidth: z.boolean().optional(),
});

export const zButton = z.object({
  type: z.literal("Button"),
  id: z.string(),
  text: z.string(),
  onPress: zActionHandler.optional(),
  style: zStyle.optional(),
  glassEffect: z.boolean().optional().default(false),
  props: zButtonProps.optional(),
});

// ── Collections & List Rendering ──────────────────────────────────────────

/** Collection definition - defines the shape of a data collection */
export const zCollectionDef = z.object({
  key: z.string(), // collection name (e.g., "todos", "sections")
  shape: z.record(z.string(), z.any()), // field definitions
  sort: z
    .array(z.object({ field: z.string(), dir: z.enum(["asc", "desc"]) }))
    .optional(),
  filter: z.any().optional(),
});

/** Collection query - reads from a collection */
export const zCollectionQuery = z.object({
  type: z.literal("collection"),
  key: z.string(), // collection name
  where: z.any().optional(), // simple predicates (reserved for future)
  orderBy: z
    .array(z.object({ field: z.string(), dir: z.enum(["asc", "desc"]) }))
    .optional(),
  limit: z.number().optional(),
});

/** For node - renders a template for each item in a collection */
export const zFor = z.object({
  type: z.literal("For"),
  id: z.string(),
  from: zCollectionQuery, // data source
  as: z.string().default("item"), // loop variable name
  keyExpr: z.string().optional(), // expression for key (e.g., "item.id")
  horizontal: z.boolean().optional(), // if true, render horizontally
  style: zStyle.optional(), // style for the list container
  template: z.lazy(() => zNode), // subtree rendered for each item
});

/** Node union */
export const zNode: z.ZodType<any> = z.discriminatedUnion("type", [
  zView,
  zThemedView,
  zText,
  zButton,
  zFor,
]);

/** Top-level Space document for a single root View */
export const zSpace = z.object({
  id: z.string(),
  sharedValues: z.array(zSharedValue).default([]),
  collections: z.array(zCollectionDef).default([]), // collection definitions
  root: z.union([zView, zThemedView]),
});

// ── inferred TS types ──────────────────────────────────────────────────────
export type SharedValue = z.infer<typeof zSharedValue>;
export type SharedRef = z.infer<typeof zSharedRef>;
export type ComputedValue = z.infer<typeof zComputedValue>;
export type EventModifierValue = z.infer<typeof zEventModifierValue>;

// Action types
export type SetSharedValueAction = z.infer<typeof zSetSharedValueAction>;
export type LogAction = z.infer<typeof zLogAction>;
export type ConditionalAction = z.infer<typeof zConditionalAction>;
export type DelayAction = z.infer<typeof zDelayAction>;
export type AnimateAction = z.infer<typeof zAnimateAction>;
export type CreateRecordAction = z.infer<typeof zCreateRecordAction>;
export type UpdateRecordAction = z.infer<typeof zUpdateRecordAction>;
export type DeleteRecordAction = z.infer<typeof zDeleteRecordAction>;
export type Action = z.infer<typeof zAction>;
export type ActionHandler = z.infer<typeof zActionHandler>;

export type Expression = z.infer<typeof zExpression>;
export type Conditional = z.infer<typeof zConditional>;
export type NumVal = z.infer<typeof zNumVal>;
export type BindingNum = z.infer<typeof zBindingNum>;
export type Style = z.infer<typeof zStyle>;
export type TextStyle = z.infer<typeof zTextStyle>;
export type ViewNode = z.infer<typeof zView>;
export type ThemedViewNode = z.infer<typeof zThemedView>;
export type TextNode = z.infer<typeof zText>;
export type ButtonNode = z.infer<typeof zButton>;
export type ForNode = z.infer<typeof zFor>;
export type CollectionDef = z.infer<typeof zCollectionDef>;
export type CollectionQuery = z.infer<typeof zCollectionQuery>;
export type SpaceDoc = z.infer<typeof zSpace>;
export type ColorOverride = z.infer<typeof zColorOverride>;
export type ThemeColorName = z.infer<typeof zThemeColorName>;
export type ColorRef = z.infer<typeof zColorRef>;
export type ColorInput = z.infer<typeof zColorInput>;

// ── Event-Based Incremental Updates ────────────────────────────────────────

/** Create a new shared value */
export const zCreateSharedValueEvent = z.object({
  event: z.literal("createSharedValue"),
  id: z.string(),
  type: zSharedType,
  initial: z.union([z.number(), z.string(), z.boolean()]),
});

/** Update a shared value */
export const zUpdateSharedValueEvent = z.object({
  event: z.literal("updateSharedValue"),
  id: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  animated: z.boolean().optional(), // if true, animate the change
  duration: z.number().optional(),
});

/** Create a view node */
export const zCreateViewEvent = z.object({
  event: z.literal("createView"),
  id: z.string(),
  type: z.enum(["View", "ThemedView", "Text", "Button", "For"]),
  style: z.union([zStyle, zTextStyle]).optional(),
  // View-specific props
  text: z.string().optional(), // for Text/Button
  glassEffect: z.boolean().optional(), // for Button
  props: z.union([zTextProps, zButtonProps]).optional(),
  // Event handlers
  onPanGestureStart: zActionHandler.optional(),
  onPanGestureChange: zActionHandler.optional(),
  onPanGestureEnd: zActionHandler.optional(),
  onPress: zActionHandler.optional(),
  // For node specific
  from: zCollectionQuery.optional(),
  as: z.string().optional(),
  keyExpr: z.string().optional(),
  horizontal: z.boolean().optional(),
  template: z.lazy(() => zNode).optional(),
});

/** Add a view as a child of another view */
export const zAddChildEvent = z.object({
  event: z.literal("addChild"),
  parentId: z.string(),
  childId: z.string(),
  index: z.number().optional(), // if not specified, append to end
});

/** Remove a child from a view */
export const zRemoveChildEvent = z.object({
  event: z.literal("removeChild"),
  parentId: z.string(),
  childId: z.string(),
});

/** Update a node's style */
export const zUpdateStyleEvent = z.object({
  event: z.literal("updateStyle"),
  id: z.string(),
  style: z.union([zStyle, zTextStyle]),
  merge: z.boolean().optional(), // if true, merge with existing style; if false, replace
  animated: z.boolean().optional(), // if true, animate the change
  duration: z.number().optional(),
});

/** Update a node's text content */
export const zUpdateTextEvent = z.object({
  event: z.literal("updateText"),
  id: z.string(),
  text: z.string(),
});

/** Delete a node */
export const zDeleteNodeEvent = z.object({
  event: z.literal("deleteNode"),
  id: z.string(),
  animated: z.boolean().optional(), // if true, fade out before removing
  duration: z.number().optional(),
});

/** Set the root view */
export const zSetRootEvent = z.object({
  event: z.literal("setRoot"),
  id: z.string(),
});

/** Batch multiple events together */
export const zBatchEvent = z.object({
  event: z.literal("batch"),
  events: z.array(
    z.union([
      zCreateSharedValueEvent,
      zUpdateSharedValueEvent,
      zCreateViewEvent,
      zAddChildEvent,
      zRemoveChildEvent,
      zUpdateStyleEvent,
      zUpdateTextEvent,
      zDeleteNodeEvent,
      zSetRootEvent,
    ])
  ),
});

/** Union of all space events */
export const zSpaceEvent = z.union([
  zCreateSharedValueEvent,
  zUpdateSharedValueEvent,
  zCreateViewEvent,
  zAddChildEvent,
  zRemoveChildEvent,
  zUpdateStyleEvent,
  zUpdateTextEvent,
  zDeleteNodeEvent,
  zSetRootEvent,
  zBatchEvent,
]);

// ── Event types ────────────────────────────────────────────────────────────
export type CreateSharedValueEvent = z.infer<typeof zCreateSharedValueEvent>;
export type UpdateSharedValueEvent = z.infer<typeof zUpdateSharedValueEvent>;
export type CreateViewEvent = z.infer<typeof zCreateViewEvent>;
export type AddChildEvent = z.infer<typeof zAddChildEvent>;
export type RemoveChildEvent = z.infer<typeof zRemoveChildEvent>;
export type UpdateStyleEvent = z.infer<typeof zUpdateStyleEvent>;
export type UpdateTextEvent = z.infer<typeof zUpdateTextEvent>;
export type DeleteNodeEvent = z.infer<typeof zDeleteNodeEvent>;
export type SetRootEvent = z.infer<typeof zSetRootEvent>;
export type BatchEvent = z.infer<typeof zBatchEvent>;
export type SpaceEvent = z.infer<typeof zSpaceEvent>;
