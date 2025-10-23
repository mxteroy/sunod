/**
 * Event-Based Renderer Module
 * 
 * Modular architecture for incremental UI rendering from event streams
 * 
 * Structure:
 * - index.tsx: Main EventBasedRenderer component
 * - types.ts: TypeScript interfaces and types
 * - actions.ts: Action execution (shared values, animations, data operations)
 * - templateBinding.ts: Template string resolution ({{var.field}})
 * - eventProcessor.ts: Event handling and node tree updates
 * - RenderNode.tsx: Node type router
 * - RenderViewNode.tsx: View/ThemedView renderer with gestures
 * - RenderTextNode.tsx: Text renderer with template binding
 * - RenderButtonNode.tsx: Button renderer with action support
 * - RenderForNode.tsx: List renderer with FlashList and collection binding
 */

export { default as EventBasedRenderer } from "./index";
export * from "./types";
export { resolveTemplateString } from "./templateBinding";
export { executeHandlerWithStore, executeHandler, executeAction } from "./actions";
