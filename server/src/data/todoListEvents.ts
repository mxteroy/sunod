import type { CollectionDef, SpaceEvent } from "@shared/schema";
import { createComposedButton } from "./composedButtonExample";

/**
 * Todo List POC Example - With Composed Buttons
 *
 * Features:
 * - Display list of todos
 * - Add new todo items with composed button
 * - Delete todos with composed buttons
 *
 * Data model:
 * - todos collection: { id, title, done }
 */

export const todoCollections: CollectionDef[] = [
  {
    key: "todos",
    shape: {
      id: "string",
      title: "string",
      done: "boolean",
    },
  },
];

export const todoListEvents: SpaceEvent[] = [
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
    text: "Todo List POC",
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
        gap: 8,
      },
      // Create shared values scoped to this template instance using {{todo.id}}
      sharedValues: [
        {
          id: "deleteBtnState_{{todo.id}}",
          type: "number",
          initial: 0,
        },
        {
          id: "deleteBtnScale_{{todo.id}}",
          type: "number",
          initial: 1.0,
        },
        {
          id: "deleteBtnBgState_{{todo.id}}",
          type: "number",
          initial: 0,
        },
      ],
      children: [
        {
          id: "todoItemText",
          type: "Text",
          text: "{{todo.title}}",
          style: {
            flex: 1,
          },
        },
        // Delete button using Selectable with custom transparent-to-red animation
        // Note: Shared value IDs are scoped per todo item using {{todo.id}}
        {
          id: "deleteTodoBtn",
          type: "Selectable",
          stateSharedValueId: "deleteBtnState_{{todo.id}}",
          style: {
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 6,
            alignSelf: "flex-start",
            backgroundColor: {
              bind: {
                type: "computed",
                op: "interpolateColor",
                args: [
                  { type: "sharedRef", ref: "deleteBtnBgState_{{todo.id}}" },
                  [0, 1],
                  ["transparent", { type: "theme", name: "error" }],
                ],
              },
            },
            transform: {
              scale: {
                bind: { type: "shared", ref: "deleteBtnScale_{{todo.id}}" },
              },
            },
          },
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
                  target: "deleteBtnScale_{{todo.id}}",
                  to: 0.95,
                  duration: 100,
                  easing: "easeOut",
                },
                {
                  type: "animate",
                  target: "deleteBtnBgState_{{todo.id}}",
                  to: 0.7,
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
                      target: "deleteBtnScale_{{todo.id}}",
                      to: 1.0,
                      duration: 150,
                      easing: "easeOut",
                    },
                    {
                      type: "animate",
                      target: "deleteBtnBgState_{{todo.id}}",
                      to: 1,
                      duration: 150,
                    },
                  ],
                  else: [
                    {
                      type: "animate",
                      target: "deleteBtnScale_{{todo.id}}",
                      to: 1.0,
                      duration: 150,
                      easing: "easeOut",
                    },
                    {
                      type: "animate",
                      target: "deleteBtnBgState_{{todo.id}}",
                      to: 0,
                      duration: 150,
                    },
                  ],
                },
              ],
            },
          ],
          onPress: [
            {
              type: "deleteRecord",
              collection: "todos",
              id: "{{todo.id}}",
            },
          ],
          children: [
            {
              id: "deleteBtnText",
              type: "Text",
              text: "🗑️",
              style: {
                fontSize: 14,
              },
            },
          ],
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

/**
 * Note: This todo list now uses composed buttons instead of concrete Button components!
 *
 * Features demonstrated:
 * - ✅ Composed button for "Add Todo" action
 * - ✅ Smooth animations (scale, opacity)
 * - ✅ Theme color support
 * - ✅ Variant and size support
 * - ✅ Data operations (createRecord) from button actions
 *
 * Limitations:
 * - Delete button in template uses simple Text (need unique IDs in templates)
 * - Context binding {{todo.title}} needs renderer support
 *
 * Next steps:
 * 1. Add template ID scoping for composed buttons in loops
 * 2. Implement checkbox toggle functionality
 * 3. Add loading states to buttons
 */
