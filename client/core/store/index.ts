/** -----------------------------------------------------------------------
 *  Store Exports
 *  - Single entry point for all store-related functionality
 * --------------------------------------------------------------------- */

export { makeSpaceStore } from "./spaceStore";
export type { SpaceStore, SpaceState, SpaceActions } from "./spaceStore";

export {
  useSpaceStore,
  getSpaceStore,
  removeSpaceStore,
  clearAllStores,
} from "./registry";

export {
  useCollection,
  useRecord,
  useShared,
  useStoreActions,
} from "./selectors";
