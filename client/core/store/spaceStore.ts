import type { CollectionDef } from "@shared/schema";
import { create } from "zustand";

/** -----------------------------------------------------------------------
 *  Zustand Store for Space Instance Data
 *  - Manages collections (todos, sections, etc.)
 *  - Manages shared values (separate from Reanimated shared values)
 *  - Provides optimized selectors to prevent re-render storms
 * --------------------------------------------------------------------- */

type RecordId = string;
type Collection = Record<RecordId, any>;

export type SpaceState = {
  collections: Record<string, Collection>;
  shared: Record<string, number | string | boolean>;
};

export type SpaceActions = {
  createRecord: (collection: string, record: any) => string;
  updateRecord: (collection: string, id: string, patch: any) => void;
  deleteRecord: (collection: string, id: string) => void;
  setShared: (id: string, value: any) => void;
  // Helper to get all records in a collection as an array
  getCollectionArray: (key: string) => any[];
  // Reset the entire store (useful for testing)
  reset: () => void;
};

export type SpaceStore = SpaceState & SpaceActions;

const initialState: SpaceState = {
  collections: {},
  shared: {},
};

/**
 * Creates a new Zustand store for a Space instance
 * Each Space has its own isolated store
 */
export const makeSpaceStore = (
  spaceId: string,
  collectionDefs?: CollectionDef[],
  initial?: Partial<SpaceState>
) => {
  // Initialize collections from definitions
  const initialCollections: Record<string, Collection> = {};
  if (collectionDefs) {
    for (const def of collectionDefs) {
      initialCollections[def.key] = {};
    }
  }

  return create<SpaceStore>()((set, get) => ({
    ...initialState,
    collections: { ...initialCollections, ...initial?.collections },
    shared: initial?.shared ?? {},

    createRecord: (collection, record) => {
      // Generate ID if not provided
      const id =
        record.id ??
        `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newRecord = { ...record, id };

      set((state) => {
        const coll = state.collections[collection] ?? {};
        return {
          collections: {
            ...state.collections,
            [collection]: {
              ...coll,
              [id]: newRecord,
            },
          },
        };
      });

      return id;
    },

    updateRecord: (collection, id, patch) => {
      set((state) => {
        const coll = state.collections[collection];
        if (!coll || !coll[id]) return state;

        return {
          collections: {
            ...state.collections,
            [collection]: {
              ...coll,
              [id]: {
                ...coll[id],
                ...patch,
              },
            },
          },
        };
      });
    },

    deleteRecord: (collection, id) => {
      set((state) => {
        const coll = state.collections[collection];
        if (!coll || !coll[id]) return state;

        const newColl = { ...coll };
        delete newColl[id];

        return {
          collections: {
            ...state.collections,
            [collection]: newColl,
          },
        };
      });
    },

    setShared: (id, value) => {
      set((state) => ({
        shared: {
          ...state.shared,
          [id]: value,
        },
      }));
    },

    getCollectionArray: (key) => {
      const coll = get().collections[key];
      if (!coll) return [];
      return Object.values(coll);
    },

    reset: () => {
      set({
        ...initialState,
        collections: { ...initialCollections },
      });
    },
  }));
};
