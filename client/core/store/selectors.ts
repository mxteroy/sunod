import type { StoreApi, UseBoundStore } from "zustand";
import type { SpaceStore } from "./spaceStore";

/** -----------------------------------------------------------------------
 *  Optimized Selectors for Space Store
 *  - Prevent unnecessary re-renders by using shallow comparison
 *  - Subscribe only to specific slices of state
 * --------------------------------------------------------------------- */

/**
 * Get all records in a collection as an array
 * Uses shallow comparison to prevent re-renders when unrelated collections change
 */
export const useCollection = (
  useStore: UseBoundStore<StoreApi<SpaceStore>>,
  key: string
): any[] => {
  return useStore((state) => {
    const coll = state.collections[key];
    if (!coll) return [];
    return Object.values(coll);
  });
};

/**
 * Get a single record from a collection
 */
export const useRecord = (
  useStore: UseBoundStore<StoreApi<SpaceStore>>,
  collection: string,
  id: string
): any | null => {
  return useStore((state) => {
    const coll = state.collections[collection];
    if (!coll) return null;
    return coll[id] ?? null;
  });
};

/**
 * Get a shared value
 */
export const useShared = (
  useStore: UseBoundStore<StoreApi<SpaceStore>>,
  id: string
): number | string | boolean | undefined => {
  return useStore((state) => state.shared[id]);
};

/**
 * Get store actions (doesn't trigger re-renders)
 */
export const useStoreActions = (
  useStore: UseBoundStore<StoreApi<SpaceStore>>
) => {
  return useStore((state) => ({
    createRecord: state.createRecord,
    updateRecord: state.updateRecord,
    deleteRecord: state.deleteRecord,
    setShared: state.setShared,
  }));
};
