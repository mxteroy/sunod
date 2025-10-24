import type { SpaceEvent } from "@shared/schema";

/**
 * Composed Button Example
 * Recreates the concrete Button component using only schema primitives
 *
 * Features:
 * - Smooth scale animation on press
 * - Color transitions on hover
 * - Width-aware scale calculation
 * - Support for variants (primary, secondary, accent, ghost)
 * - Support for sizes (sm, md, lg)
 */

/**
 * Creates a composed button with all the features of the concrete Button component
 */
export function createComposedButton(config: {
  id: string;
  text: string;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  onPress?: any[];
  disabled?: boolean;
}): SpaceEvent[] {
  const {
    id,
    text,
    variant = "primary",
    size = "md",
    onPress = [],
    disabled = false,
  } = config;

  // Size configurations
  const sizes = {
    sm: { ph: 12, pv: 8, radius: 12, gap: 6, font: 13 },
    md: { ph: 16, pv: 12, radius: 14, gap: 8, font: 15 },
    lg: { ph: 20, pv: 16, radius: 18, gap: 10, font: 17 },
  };

  const S = sizes[size];

  // Color configurations based on variant
  const colorSchemes = {
    primary: {
      bg: { type: "theme" as const, name: "primary" as const },
      hoverBg: { type: "theme" as const, name: "primaryHover" as const },
      textColor: { type: "theme" as const, name: "text" as const },
      borderColor: "transparent",
      borderWidth: 0,
    },
    secondary: {
      bg: { type: "theme" as const, name: "secondary" as const },
      hoverBg: { type: "theme" as const, name: "secondaryHover" as const },
      textColor: { type: "theme" as const, name: "text" as const },
      borderColor: "transparent",
      borderWidth: 0,
    },
    accent: {
      bg: { type: "theme" as const, name: "accent" as const },
      hoverBg: { type: "theme" as const, name: "accentHover" as const },
      textColor: { type: "theme" as const, name: "text" as const },
      borderColor: "transparent",
      borderWidth: 0,
    },
    ghost: {
      bg: "transparent",
      hoverBg: { type: "theme" as const, name: "surfaceHover" as const },
      textColor: { type: "theme" as const, name: "primary" as const },
      borderColor: { type: "theme" as const, name: "surface" as const },
      borderWidth: 1,
    },
  };

  const colors = colorSchemes[variant];

  const stateId = `${id}_state`;
  const scaleId = `${id}_scale`;
  const opacityId = `${id}_opacity`;
  const bgStateId = `${id}_bgState`; // 0=default bg, 1=hover bg
  const widthId = `${id}_width`; // Measured width of button
  const targetScaleId = `${id}_targetScale`; // Calculated target scale based on width

  return [
    // ============ Shared Values ============
    {
      event: "createSharedValue",
      id: stateId,
      type: "number",
      initial: 0, // 0=DEFAULT, 1=HOVERED, 2=PRESSED
    },
    {
      event: "createSharedValue",
      id: scaleId,
      type: "number",
      initial: 1.0,
    },
    {
      event: "createSharedValue",
      id: opacityId,
      type: "number",
      initial: disabled ? 0.5 : 1.0,
    },
    {
      event: "createSharedValue",
      id: bgStateId,
      type: "number",
      initial: 0,
    },
    {
      event: "createSharedValue",
      id: widthId,
      type: "number",
      initial: 0, // Will be updated by measure binding
    },
    {
      event: "createSharedValue",
      id: targetScaleId,
      type: "number",
      initial: 0.96, // Fallback value
    },

    // ============ Button Container (Selectable) ============
    {
      event: "createView",
      id: id,
      type: "Selectable",
      stateSharedValueId: stateId,
      disabled: disabled,
      style: {
        paddingLeft: S.ph,
        paddingRight: S.ph,
        paddingTop: S.pv,
        paddingBottom: S.pv,
        borderRadius: S.radius,
        // Background color interpolated between default and hover based on bgStateId
        backgroundColor: {
          bind: {
            type: "computed",
            op: "interpolateColor",
            args: [
              { type: "sharedRef", ref: bgStateId },
              [0, 1], // input range: 0=default, 1=hover
              variant === "ghost"
                ? ["transparent", colors.hoverBg]
                : [colors.bg, colors.hoverBg],
            ],
          },
        },
        // Bind scale to shared value
        transform: {
          scale: { bind: { type: "shared", ref: scaleId } },
        },
        opacity: { bind: { type: "shared", ref: opacityId } },
      },
      // UI thread handler - runs animations at 60fps without JS thread
      onSelectableStateChange_UI: [
        {
          type: "conditional",
          condition: {
            left: "state",
            op: "==",
            right: 2, // PRESSED
          },
          then: [
            {
              type: "animate",
              target: scaleId,
              // Calculate target scale: max(0.85, (width - 12) / max(width, 1))
              // Using max(width, 1) to avoid divide by zero when width not measured yet
              to: {
                type: "computed",
                op: "max",
                args: [
                  0,
                  {
                    type: "computed",
                    op: "div",
                    args: [
                      {
                        type: "computed",
                        op: "sub",
                        args: [{ type: "sharedRef", ref: widthId }, 12],
                      },
                      {
                        type: "computed",
                        op: "max",
                        args: [{ type: "sharedRef", ref: widthId }, 1],
                      },
                    ],
                  },
                ],
              },
              duration: 250,
              easing: "easeOut",
            },
            {
              type: "animate",
              target: bgStateId,
              to: 0, // back to default on press
              duration: 100,
            },
          ],
          else: [
            {
              type: "conditional",
              condition: {
                left: "state",
                op: "==",
                right: 1, // HOVERED
              },
              then: [
                {
                  type: "animate",
                  target: scaleId,
                  to: 1.0,
                  duration: 200,
                  easing: "easeOut",
                },
                {
                  type: "animate",
                  target: bgStateId,
                  to: 1, // hover state
                  duration: 200,
                  easing: "easeOut",
                },
              ],
              else: [
                // DEFAULT
                {
                  type: "animate",
                  target: scaleId,
                  to: 1.0,
                  duration: 200,
                  easing: "easeOut",
                },
                {
                  type: "animate",
                  target: bgStateId,
                  to: 0, // default state
                  duration: 200,
                  easing: "easeOut",
                },
              ],
            },
          ],
        },
      ],
      onPress: onPress,
    },

    // ============ Button Content Container ============
    {
      event: "createView",
      id: `${id}_content`,
      type: "View",
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: S.gap,
      },
    },

    // ============ Button Text ============
    {
      event: "createView",
      id: `${id}_text`,
      type: "Text",
      text: text,
      style: {
        fontSize: S.font,
        color: colors.textColor,
      },
    },

    // ============ Assembly ============
    {
      event: "addChild",
      parentId: `${id}_content`,
      childId: `${id}_text`,
    },
    {
      event: "addChild",
      parentId: id,
      childId: `${id}_content`,
    },

    // ============ Measure Binding ============
    // Track button width and calculate target scale: (width - 12) / width
    // Must be AFTER node creation
    {
      event: "createMeasureBinding",
      nodeId: id,
      property: "width",
      targetSharedValueId: widthId,
    },
  ];
}

/**
 * Example: Todo List with Composed Buttons
 */
export const composedButtonTodoExample: SpaceEvent[] = [
  // ============ Root Container ============
  {
    event: "createView",
    id: "root",
    type: "ThemedView",
    style: {
      flex: 1,
      padding: 20,
    },
  },
  {
    event: "setRoot",
    id: "root",
  },

  // ============ Header ============
  {
    event: "createView",
    id: "headerTitle",
    type: "Text",
    text: "Composed Buttons Demo",
    props: {
      variant: "h1",
    },
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "headerTitle",
  },

  // ============ Button Container ============
  {
    event: "createView",
    id: "buttonContainer",
    type: "View",
    style: {
      gap: 12,
      marginTop: 20,
    },
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "buttonContainer",
  },

  // ============ Composed Buttons ============
  // Primary button
  ...createComposedButton({
    id: "primaryBtn",
    text: "Primary Button",
    variant: "primary",
    size: "md",
    onPress: [
      {
        type: "log",
        message: "Primary button pressed!",
      },
    ],
  }),
  {
    event: "addChild",
    parentId: "buttonContainer",
    childId: "primaryBtn",
  },

  // Secondary button
  ...createComposedButton({
    id: "secondaryBtn",
    text: "Secondary Button",
    variant: "secondary",
    size: "md",
    onPress: [
      {
        type: "log",
        message: "Secondary button pressed!",
      },
    ],
  }),
  {
    event: "addChild",
    parentId: "buttonContainer",
    childId: "secondaryBtn",
  },

  // Accent button
  ...createComposedButton({
    id: "accentBtn",
    text: "Accent Button",
    variant: "accent",
    size: "md",
    onPress: [
      {
        type: "log",
        message: "Accent button pressed!",
      },
    ],
  }),
  {
    event: "addChild",
    parentId: "buttonContainer",
    childId: "accentBtn",
  },

  // Ghost button
  ...createComposedButton({
    id: "ghostBtn",
    text: "Ghost Button",
    variant: "ghost",
    size: "md",
    onPress: [
      {
        type: "log",
        message: "Ghost button pressed!",
      },
    ],
  }),
  {
    event: "addChild",
    parentId: "buttonContainer",
    childId: "ghostBtn",
  },

  // Small button
  ...createComposedButton({
    id: "smallBtn",
    text: "Small",
    variant: "primary",
    size: "sm",
    onPress: [
      {
        type: "log",
        message: "Small button pressed!",
      },
    ],
  }),
  {
    event: "addChild",
    parentId: "buttonContainer",
    childId: "smallBtn",
  },

  // Large button
  ...createComposedButton({
    id: "largeBtn",
    text: "Large Button",
    variant: "primary",
    size: "lg",
    onPress: [
      {
        type: "log",
        message: "Large button pressed!",
      },
    ],
  }),
  {
    event: "addChild",
    parentId: "buttonContainer",
    childId: "largeBtn",
  },

  // Disabled button
  ...createComposedButton({
    id: "disabledBtn",
    text: "Disabled Button",
    variant: "primary",
    size: "md",
    disabled: true,
  }),
  {
    event: "addChild",
    parentId: "buttonContainer",
    childId: "disabledBtn",
  },
];

/**
 * Updated Todo List using Composed Buttons
 */
export const composedButtonTodoList: SpaceEvent[] = [
  // ============ Root Container ============
  {
    event: "createView",
    id: "root",
    type: "ThemedView",
    style: {
      flex: 1,
      padding: 20,
    },
  },
  {
    event: "setRoot",
    id: "root",
  },

  // ============ Header ============
  {
    event: "createView",
    id: "headerTitle",
    type: "Text",
    text: "Todo List (Composed)",
    props: {
      variant: "h1",
    },
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "headerTitle",
  },

  // ============ Add Todo Button (Composed) ============
  ...createComposedButton({
    id: "addTodoBtn",
    text: "+ Add Todo",
    variant: "primary",
    size: "md",
    onPress: [
      {
        type: "createRecord",
        collection: "todos",
        record: {
          title: "New Todo",
          done: false,
        },
      },
    ],
  }),
  {
    event: "addChild",
    parentId: "root",
    childId: "addTodoBtn",
  },

  // ============ Todos List ============
  {
    event: "createView",
    id: "todosList",
    type: "For",
    from: {
      type: "collection",
      key: "todos",
    },
    as: "todo",
    keyExpr: "todo.id",
    style: {
      flex: 1,
      marginTop: 20,
    },
    template: {
      id: "todoItemTemplate",
      type: "View",
      style: {
        padding: 10,
        backgroundColor: { light: "#f0f0f0", dark: "#2a2a2a" },
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      children: [
        {
          id: "todoItemText",
          type: "Text",
          text: "{{todo.title}}",
          style: {
            flex: 1,
          },
        },
        // Note: For delete button in template, we need to generate unique IDs
        // This is a limitation that needs template ID scoping
        {
          id: "deleteTodoBtnPlaceholder",
          type: "Text",
          text: "Delete", // Temporary - should be composed button
          style: {
            color: { light: "#ff4444", dark: "#cc0000" },
          },
        },
      ],
    } as any,
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "todosList",
  },
];
