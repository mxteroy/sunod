import type { CollectionQuery, Style, TextStyle } from "@shared/schema";
import type { StoreApi, UseBoundStore } from "zustand";
import type { SpaceStore } from "../../store";
import type { SVMap } from "../FullSchemaRenderer";

/**
 * Node state stored in the renderer
 * Represents the internal structure of UI nodes with their properties and relationships
 */
export interface NodeState {
  id: string;
  type: "View" | "ThemedView" | "Text" | "Button" | "For";
  style?: Style | TextStyle;
  text?: string;
  glassEffect?: boolean;
  props?: any;
  onPanGestureStart?: any;
  onPanGestureChange?: any;
  onPanGestureEnd?: any;
  onPress?: any;
  children: (string | NodeState)[]; // child IDs or inline node objects (for templates)
  parentId?: string;
  // For node specific properties
  from?: CollectionQuery;
  as?: string;
  keyExpr?: string;
  horizontal?: boolean;
  template?: NodeState;
}

/**
 * Props passed to all render components
 */
export interface RenderNodeProps {
  node: NodeState;
  nodes: Map<string, NodeState>;
  map: SVMap;
  isRoot?: boolean;
  store?: UseBoundStore<StoreApi<SpaceStore>>;
  itemContext?: any;
  itemVar?: string;
}

/**
 * Props for EventBasedRenderer
 */
export interface EventBasedRendererProps {
  events?: any[];
  spaceId?: string;
  store?: UseBoundStore<StoreApi<SpaceStore>>;
}
