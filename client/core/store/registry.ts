import type { CollectionDef } from "@shared/schema";
import type { StoreApi, UseBoundStore } from "zustand";
import type { SpaceStore } from "./spaceStore";
import { makeSpaceStore } from "./spaceStore";

/** -----------------------------------------------------------------------
 *  Per-Space Store Registry
 *  - Each Space instance gets its own isolated store
 *  - Prevents cross-contamination between ephemeral instances
 *  - Allows multiple Spaces to coexist in the same app
 * --------------------------------------------------------------------- */

const registry = new Map<string, UseBoundStore<StoreApi<SpaceStore>>>();

/**
 * Get or create a store for a Space instance
 * Call this from your renderer to access the store
 */
export function useSpaceStore(
  spaceId: string,
  collectionDefs?: CollectionDef[]
): UseBoundStore<StoreApi<SpaceStore>> {
  if (!registry.has(spaceId)) {
    const store = makeSpaceStore(spaceId, collectionDefs);
    registry.set(spaceId, store);
  }
  return registry.get(spaceId)!;
}

/**
 * Get a store without React (for use in action interpreters)
 */
export function getSpaceStore(
  spaceId: string
): UseBoundStore<StoreApi<SpaceStore>> | undefined {
  return registry.get(spaceId);
}

/**
 * Remove a store (cleanup when Space is unmounted)
 */
export function removeSpaceStore(spaceId: string): void {
  registry.delete(spaceId);
}

/**
 * Clear all stores (useful for testing)
 */
export function clearAllStores(): void {
  registry.clear();
}
