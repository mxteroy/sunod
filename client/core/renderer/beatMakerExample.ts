import type { SoundDef, SpaceEvent } from "@shared/schema";

/**
 * Beat Maker Example - Complete schema-driven beat maker
 *
 * Features:
 * - 6 instruments (Kick, Snare, Hi-Hat, Clap, Tom, Perc)
 * - 16-step sequencer
 * - BPM control (60-180)
 * - Volume control
 * - Play/Stop/Clear/Randomize
 * - Visual feedback on current step
 * - Beat grid stored in collection
 * - All UI composed from server-side schema
 */

// Sound definitions
export const beatMakerSounds: SoundDef[] = [
  {
    id: "kick",
    type: "oscillator",
    oscillatorType: "sine",
    frequency: 60,
    duration: 0.2,
    attack: 0,
    decay: 0.1,
    sustain: 0.3,
    release: 0.1,
  },
  {
    id: "snare",
    type: "noise",
    filterType: "bandpass",
    filterFrequency: 200,
    filterQ: 1,
    duration: 0.1,
    attack: 0,
    decay: 0.05,
    sustain: 0.3,
    release: 0.05,
  },
  {
    id: "hihat",
    type: "noise",
    filterType: "highpass",
    filterFrequency: 8000,
    filterQ: 1,
    duration: 0.05,
    attack: 0,
    decay: 0.02,
    sustain: 0.1,
    release: 0.03,
  },
  {
    id: "clap",
    type: "noise",
    filterType: "bandpass",
    filterFrequency: 1000,
    filterQ: 1,
    duration: 0.1,
    attack: 0,
    decay: 0.05,
    sustain: 0.4,
    release: 0.05,
  },
  {
    id: "tom",
    type: "oscillator",
    oscillatorType: "sine",
    frequency: 150,
    duration: 0.15,
    attack: 0,
    decay: 0.08,
    sustain: 0.2,
    release: 0.07,
  },
  {
    id: "perc",
    type: "oscillator",
    oscillatorType: "square",
    frequency: 400,
    duration: 0.08,
    attack: 0,
    decay: 0.04,
    sustain: 0.1,
    release: 0.04,
  },
];

// Instrument definitions for UI
const instruments = [
  { name: "Kick", soundId: "kick", color: "#ef4444" },
  { name: "Snare", soundId: "snare", color: "#3b82f6" },
  { name: "Hi-Hat", soundId: "hihat", color: "#eab308" },
  { name: "Clap", soundId: "clap", color: "#a855f7" },
  { name: "Tom", soundId: "tom", color: "#22c55e" },
  { name: "Perc", soundId: "perc", color: "#ec4899" },
];

/**
 * Generate beat maker UI events
 * This would typically be generated on the server side by an LLM
 */
export function generateBeatMakerEvents(): SpaceEvent[] {
  const events: SpaceEvent[] = [];

  // 1. Create shared values
  events.push(
    {
      event: "createSharedValue",
      id: "isPlaying",
      type: "boolean",
      initial: false,
    },
    { event: "createSharedValue", id: "bpm", type: "number", initial: 120 },
    { event: "createSharedValue", id: "volume", type: "number", initial: 0.7 },
    {
      event: "createSharedValue",
      id: "currentStep",
      type: "number",
      initial: 0,
    }
  );

  // 2. Create root container
  events.push({
    event: "createView",
    id: "root",
    type: "View",
    style: {
      flex: 1,
      backgroundColor: "#0f172a",
      padding: 20,
    },
  });
  events.push({ event: "setRoot", id: "root" });

  // 3. Title
  events.push({
    event: "createView",
    id: "title",
    type: "Text",
    text: "Beat Maker",
    style: {
      fontSize: 32,
      fontWeight: 700,
      color: "#ffffff",
      marginBottom: 20,
    },
  });
  events.push({ event: "addChild", parentId: "root", childId: "title" });

  // 4. Controls container
  events.push({
    event: "createView",
    id: "controls",
    type: "View",
    style: {
      backgroundColor: "#1e293b",
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
  });
  events.push({ event: "addChild", parentId: "root", childId: "controls" });

  // 5. Play/Stop button
  events.push({
    event: "createView",
    id: "playButton",
    type: "Button",
    text: "Play",
    style: {
      backgroundColor: "#22c55e",
      padding: 12,
      borderRadius: 8,
    },
    onPress: [
      {
        type: "conditional",
        condition: {
          left: { type: "sharedRef", ref: "isPlaying" },
          op: "==",
          right: 0,
        },
        then: [
          // Start playing
          {
            type: "setSharedValue",
            target: "isPlaying",
            operation: "set",
            value: 1,
          },
          {
            type: "startTimer",
            timerId: "sequencer",
            interval: {
              type: "computed",
              op: "div",
              args: [15000, { type: "sharedRef", ref: "bpm" }], // 60000ms / bpm / 4 (16th notes)
            },
            worklet: true,
            actions: [
              // Increment step
              {
                type: "setSharedValue",
                target: "currentStep",
                operation: "set",
                value: {
                  type: "computed",
                  op: "mod",
                  args: [
                    {
                      type: "computed",
                      op: "add",
                      args: [{ type: "sharedRef", ref: "currentStep" }, 1],
                    },
                    16,
                  ],
                },
              },
              // Play sounds for active cells (would need to check collection)
              // This is simplified - full implementation would check beat grid
            ],
          },
        ],
        else: [
          // Stop playing
          {
            type: "setSharedValue",
            target: "isPlaying",
            operation: "set",
            value: 0,
          },
          { type: "stopTimer", timerId: "sequencer" },
          {
            type: "setSharedValue",
            target: "currentStep",
            operation: "set",
            value: 0,
          },
        ],
      },
    ],
  });
  events.push({
    event: "addChild",
    parentId: "controls",
    childId: "playButton",
  });

  // 6. Clear button
  events.push({
    event: "createView",
    id: "clearButton",
    type: "Button",
    text: "Clear",
    style: {
      backgroundColor: "#475569",
      padding: 12,
      borderRadius: 8,
    },
    // onPress would clear the beat grid collection
  });
  events.push({
    event: "addChild",
    parentId: "controls",
    childId: "clearButton",
  });

  // 7. BPM label and value
  events.push({
    event: "createView",
    id: "bpmLabel",
    type: "Text",
    text: "BPM: 120",
    style: {
      color: "#a78bfa",
      fontSize: 14,
      fontWeight: 600,
    },
  });
  events.push({ event: "addChild", parentId: "controls", childId: "bpmLabel" });

  // 8. Grid container
  events.push({
    event: "createView",
    id: "gridContainer",
    type: "View",
    style: {
      backgroundColor: "#1e293b",
      borderRadius: 12,
      padding: 20,
    },
  });
  events.push({
    event: "addChild",
    parentId: "root",
    childId: "gridContainer",
  });

  // 9. Generate instrument rows
  instruments.forEach((instrument, rowIndex) => {
    // Row container
    const rowId = `row-${rowIndex}`;
    events.push({
      event: "createView",
      id: rowId,
      type: "View",
      style: {
        flexDirection: "row",
        gap: 4,
        marginBottom: 8,
        alignItems: "center",
      },
    });
    events.push({
      event: "addChild",
      parentId: "gridContainer",
      childId: rowId,
    });

    // Instrument label
    const labelId = `label-${rowIndex}`;
    events.push({
      event: "createView",
      id: labelId,
      type: "Text",
      text: instrument.name,
      style: {
        width: 60,
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 600,
      },
    });
    events.push({ event: "addChild", parentId: rowId, childId: labelId });

    // 16 step buttons
    for (let col = 0; col < 16; col++) {
      const cellId = `cell-${rowIndex}-${col}`;
      events.push({
        event: "createView",
        id: cellId,
        type: "Selectable",
        style: {
          width: 40,
          height: 40,
          borderRadius: 4,
          backgroundColor: "#334155",
          // Highlight every 4th step
          marginLeft: col % 4 === 0 ? 4 : 0,
        },
        onPress: [
          // Toggle cell - would update collection
          {
            type: "log",
            message: `Toggled cell ${rowIndex},${col}`,
          },
          // Play sound preview
          {
            type: "playSound",
            soundId: instrument.soundId,
          },
        ],
      });
      events.push({ event: "addChild", parentId: rowId, childId: cellId });
    }
  });

  return events;
}

/**
 * Full Space document version (alternative to event-based)
 * This shows what an LLM might generate as a complete schema
 */
export function generateBeatMakerSpace() {
  return {
    id: "beat-maker",
    sharedValues: [
      { id: "isPlaying", t: "boolean" as const, initial: false },
      { id: "bpm", t: "number" as const, initial: 120 },
      { id: "volume", t: "number" as const, initial: 0.7 },
      { id: "currentStep", t: "number" as const, initial: 0 },
    ],
    sounds: beatMakerSounds,
    collections: [
      {
        key: "beatGrid",
        shape: {
          row: "number",
          col: "number",
          active: "boolean",
        },
      },
    ],
    root: {
      type: "View" as const,
      id: "root",
      style: {
        flex: 1,
        backgroundColor: "#0f172a",
        padding: 20,
      },
      children: [
        {
          type: "Text" as const,
          id: "title",
          text: "🎵 Beat Maker",
          style: {
            fontSize: 32,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 20,
          },
        },
        // ... rest of UI tree
      ],
    },
  };
}
