import { todoListEvents } from "../../../../data/todoListEvents";
import type { SubscriptionResolvers } from "./../../../../schema/types.generated";

/**
 * Async generator that yields events one by one with timing control
 */
async function* generateDemoSpaceEvents() {
  // Group events by their logical stages for progressive rendering
  const stages = [
    { events: todoListEvents.slice(0, 15), delay: 100 }, // All shared values + root
    { events: todoListEvents.slice(15, 17), delay: 300 }, // Main draggable container
    { events: todoListEvents.slice(17, 25), delay: 300 }, // Inner elements
    { events: todoListEvents.slice(25, 29), delay: 300 }, // Controller
    { events: todoListEvents.slice(29, 31), delay: 300 }, // Controller label + title
    { events: todoListEvents.slice(31, 33), delay: 300 }, // Button
    { events: todoListEvents.slice(33), delay: 300 }, // Status text
  ];

  for (const stage of stages) {
    for (const event of stage.events) {
      yield event;
      // Add a small delay between events in the same stage
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    // Longer delay between stages for visual effect
    if (stage.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, stage.delay));
    }
  }
}

export const demoSpaceEvents: NonNullable<
  SubscriptionResolvers["demoSpaceEvents"]
> = {
  subscribe: async function* (_parent, _arg, _ctx) {
    // Yield each event from the generator
    for await (const event of generateDemoSpaceEvents()) {
      yield { demoSpaceEvents: event };
    }
  },
};
