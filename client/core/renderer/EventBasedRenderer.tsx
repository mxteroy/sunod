/**
 * Event-Based Incremental Renderer
 *
 * This file is a compatibility layer that re-exports the modular implementation
 * from the event-based/ directory.
 *
 * The renderer has been split into multiple files for better organization:
 * - event-based/index.tsx: Main renderer component
 * - event-based/types.ts: TypeScript types
 * - event-based/actions.ts: Action execution
 * - event-based/templateBinding.ts: Template string resolution
 * - event-based/eventProcessor.ts: Event handling
 * - event-based/RenderNode.tsx: Node routing
 * - event-based/RenderViewNode.tsx: View rendering
 * - event-based/RenderTextNode.tsx: Text rendering
 * - event-based/RenderButtonNode.tsx: Button rendering
 * - event-based/RenderForNode.tsx: List rendering
 *
 * @deprecated Import from './event-based' instead for better tree-shaking
 */

export { default } from "./event-based/index";
export type {
  EventBasedRendererProps,
  NodeState,
  RenderNodeProps,
} from "./event-based/types";
