import {
  beatMakerSounds,
  generateCompleteBeatMaker,
} from "../../../../data/beatMakerGenerator";
import type { SubscriptionResolvers } from "./../../../../schema/types.generated";

const events = generateCompleteBeatMaker();

console.log(
  `[Beat Maker] Generated ${events.length} events and ${beatMakerSounds.length} sounds`,
);

/**
 * Async generator that yields events one by one with timing control
 */
async function* generateDemoSpaceEvents() {
  // Beat maker event structure:
  // 0-103: Shared values (isPlaying, bpm, volume, currentStep, 96 cells)
  // 104-105: Root container setup
  // 106-107: Content container
  // 108-111: Header (title, subtitle)
  // 112-onwards: Controls, sliders, grid

  // Send all shared values first (needed for bindings)
  for (let i = 0; i < 104; i++) {
    yield events[i];
  }
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Send remaining UI events all at once
  for (let i = 104; i < events.length; i++) {
    yield events[i];
  }
}

export const demoSpaceEvents: NonNullable<
  SubscriptionResolvers["demoSpaceEvents"]
> = {
  subscribe: async function* (_parent, _arg, _ctx) {
    // Send both sounds and events as a single payload
    // The client will need to extract sounds and register them
    yield {
      demoSpaceEvents: {
        sounds: beatMakerSounds,
        events: events,
      },
    };
  },
};
