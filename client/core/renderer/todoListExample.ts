import type { CollectionDef, SpaceEvent } from "@shared/schema";

/**
 * Todo List POC Example - Simplified
 *
 * Features:
 * - Display list of todos
 * - Add new todo items
 * - Delete todos
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

  // ============ Add Todo Button ============
  {
    event: "createView",
    id: "addTodoBtn",
    type: "Button",
    text: "+ Add Todo",
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
  },
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
      },
      children: [],
    } as any,
  },
  {
    event: "addChild",
    parentId: "root",
    childId: "todosList",
  },
];

/**
 * Note: This is a minimal POC. Context binding for {{todo.title}}, etc.
 * needs to be implemented in the renderer to display actual todo data.
 *
 * Next steps:
 * 1. Implement context binding in RenderForNode
 * 2. Add todo item children (checkbox, title, delete button)
 * 3. Test with initial seed data in the store
 */
