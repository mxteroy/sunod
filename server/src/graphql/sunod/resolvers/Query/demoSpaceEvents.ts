import { interactiveDraggableEvents } from "../../../../data/demoSpaceEvents";
import type { QueryResolvers } from "./../../../../schema/types.generated";

export const demoSpaceEvents: NonNullable<
  QueryResolvers["demoSpaceEvents"]
> = async (_parent, _arg, _ctx) => {
  // Return the demo space events as JSON
  return interactiveDraggableEvents as any[];
};
