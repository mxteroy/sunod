/**
 * Server-Side Beat Maker Generator
 *
 * This demonstrates how an LLM on the server would generate a complete
 * beat maker UI from a natural language description or by analyzing
 * the React code structure.
 *
 * Goal: Recreate the full beat maker from the React example with:
 * - 6 instruments (Kick, Snare, Hi-Hat, Clap, Tom, Perc)
 * - 16-step sequencer grid
 * - Play/Pause/Clear/Randomize controls
 * - BPM slider (60-180)
 * - Volume slider
 * - Visual feedback on current step
 * - All generated from server-side schema
 */

import type { SoundDef, SpaceEvent } from "../../../shared/schema";

// ============================================================================
// SOUND DEFINITIONS - Instrument synthesis parameters
// ============================================================================

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

// Instrument metadata for UI generation
const instruments = [
  { name: "Kick", soundId: "kick", color: "#ef4444" },
  { name: "Snare", soundId: "snare", color: "#3b82f6" },
  { name: "Hi-Hat", soundId: "hihat", color: "#eab308" },
  { name: "Clap", soundId: "clap", color: "#a855f7" },
  { name: "Tom", soundId: "tom", color: "#22c55e" },
  { name: "Perc", soundId: "perc", color: "#ec4899" },
];

// ============================================================================
// SERVER-SIDE EVENT GENERATOR
// This is what the LLM would generate from the React code
// ============================================================================

export function generateCompleteBeatMaker(): SpaceEvent[] {
  const events: SpaceEvent[] = [];

  // ──────────────────────────────────────────────────────────────────────
  // 1. SHARED VALUES - Application State
  // ──────────────────────────────────────────────────────────────────────

  events.push(
    // Playback state
    {
      event: "createSharedValue",
      id: "isPlaying",
      type: "number",
      initial: 0,
    },

    // Controls
    { event: "createSharedValue", id: "bpm", type: "number", initial: 120 },
    { event: "createSharedValue", id: "volume", type: "number", initial: 0.7 },

    // Sequencer state
    {
      event: "createSharedValue",
      id: "currentStep",
      type: "number",
      initial: 0,
    },

    // BPM slider drag state (for smooth UI updates)
    {
      event: "createSharedValue",
      id: "bpmSliderDrag",
      type: "number",
      initial: 0,
    },
    {
      event: "createSharedValue",
      id: "volumeSliderDrag",
      type: "number",
      initial: 0,
    }
  );

  // Beat grid state (6 instruments × 16 steps = 96 cells)
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 16; col++) {
      events.push({
        event: "createSharedValue",
        id: `cell_${row}_${col}`,
        type: "boolean",
        initial: false, // All cells start inactive
      });
    }
  }

  // Column scale values for animation (one per column)
  for (let col = 0; col < 16; col++) {
    events.push({
      event: "createSharedValue",
      id: `columnScale_${col}`,
      type: "number",
      initial: 1.0, // All columns start at normal scale
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // 2. ROOT CONTAINER - Gradient background like the React example
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "root",
    type: "View",
    style: {
      flex: 1,
      backgroundColor: { type: "theme", name: "background" },
      padding: 32,
      alignItems: "center",
      justifyContent: "flex-start",
    },
  });
  events.push({ event: "setRoot", id: "root" });

  // Content container with proper flex layout
  events.push({
    event: "createView",
    id: "content",
    type: "View",
    style: {
      gap: 24,
      paddingBottom: 32,
    },
  });
  events.push({ event: "addChild", parentId: "root", childId: "content" });

  // ──────────────────────────────────────────────────────────────────────
  // 3. HEADER - Title and subtitle
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "title",
    type: "Text",
    text: "Beat Maker",
    style: {
      fontSize: 48,
      fontWeight: 700,
      color: { type: "theme", name: "text" },
      marginBottom: 8,
    },
  });
  events.push({ event: "addChild", parentId: "content", childId: "title" });

  events.push({
    event: "createView",
    id: "subtitle",
    type: "Text",
    text: "Click cells to create your rhythm",
    style: {
      fontSize: 16,
      color: { type: "theme", name: "accent" },
      marginBottom: 32,
    },
  });
  events.push({ event: "addChild", parentId: "content", childId: "subtitle" });

  // ──────────────────────────────────────────────────────────────────────
  // 4. CONTROLS PANEL - Play, Clear, Randomize, BPM, Volume
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "controls",
    type: "View",
    style: {
      backgroundColor: { type: "theme", name: "surface" },
      borderRadius: 12,
      padding: 24,
      marginBottom: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
    },
  });
  events.push({ event: "addChild", parentId: "content", childId: "controls" });

  // Left side - Action buttons
  events.push({
    event: "createView",
    id: "controlsLeft",
    type: "View",
    style: {
      flexDirection: "row",
      gap: 12,
    },
  });
  events.push({
    event: "addChild",
    parentId: "controls",
    childId: "controlsLeft",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 4A. PLAY/STOP BUTTON
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "playButton",
    type: "Selectable",
    style: {
      backgroundColor: {
        bind: {
          type: "computed",
          op: "interpolateColor",
          args: [
            { type: "sharedRef", ref: "isPlaying" },
            [0, 1],
            [
              { type: "theme", name: "primary" },
              { type: "theme", name: "error" },
            ], // primary when stopped, error when playing
          ],
        },
      },
      padding: 12,
      paddingLeft: 24,
      paddingRight: 24,
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
          // START PLAYING
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
              args: [15000, { type: "sharedRef", ref: "bpm" }], // 60000 / bpm / 4
            },
            worklet: true, // Run on UI thread for smooth animations
            actions: [
              // Increment step with wraparound
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
              // Animate column scales: scale up the current column, scale down others
              ...Array.from({ length: 16 }, (_, col) => ({
                type: "animate" as const,
                target: `columnScale_${col}`,
                to: {
                  type: "cond" as const,
                  if: {
                    left: { type: "sharedRef" as const, ref: "currentStep" },
                    op: "==" as const,
                    right: col,
                  },
                  then: 1.15, // Scale up the current column
                  else: 1.0, // Normal scale for other columns
                },
                duration: 100, // Fast animation (100ms)
                easing: "easeOut" as const,
              })),
              // Check each instrument at each step position
              // For each instrument, check if the cell at current position is active
              ...instruments.flatMap((inst, row) =>
                // Generate 16 conditionals, one for each possible step
                Array.from({ length: 16 }, (_, col) => ({
                  type: "conditional" as const,
                  condition: {
                    left: { type: "sharedRef" as const, ref: "currentStep" },
                    op: "==" as const,
                    right: col,
                  },
                  then: [
                    {
                      type: "conditional" as const,
                      condition: {
                        left: {
                          type: "sharedRef" as const,
                          ref: `cell_${row}_${col}`,
                        },
                        op: "==" as const,
                        right: 1,
                      },
                      then: [
                        {
                          type: "playSound" as const,
                          soundId: inst.soundId,
                          volume: { type: "sharedRef" as const, ref: "volume" },
                        },
                      ],
                    },
                  ],
                }))
              ),
            ],
          },
        ],
        else: [
          // STOP PLAYING
          {
            type: "setSharedValue",
            target: "isPlaying",
            operation: "set",
            value: 0,
          },
          { type: "stopTimer", timerId: "sequencer" },
          // Don't reset currentStep - allow resuming from current position
        ],
      },
    ],
  });
  events.push({
    event: "addChild",
    parentId: "controlsLeft",
    childId: "playButton",
  });

  // Play button text (dynamic - changes based on state)
  events.push({
    event: "createView",
    id: "playButtonText",
    type: "Text",
    text: "{{isPlaying==0?▶ Play:⏸ Pause}}", // Dynamic text based on playing state
    style: {
      color: { type: "theme", name: "text" },
      fontSize: 16,
      fontWeight: 600,
    },
  });
  events.push({
    event: "addChild",
    parentId: "playButton",
    childId: "playButtonText",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 4B. CLEAR BUTTON
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "clearButton",
    type: "Selectable",
    style: {
      backgroundColor: { type: "theme", name: "secondary" },
      padding: 12,
      paddingLeft: 24,
      paddingRight: 24,
      borderRadius: 8,
    },
    onPress: [
      // Clear all cells
      ...Array.from({ length: 6 * 16 }, (_, i) => {
        const row = Math.floor(i / 16);
        const col = i % 16;
        return {
          type: "setSharedValue",
          target: `cell_${row}_${col}`,
          operation: "set",
          value: 0,
        };
      }),
    ],
  });
  events.push({
    event: "addChild",
    parentId: "controlsLeft",
    childId: "clearButton",
  });

  events.push({
    event: "createView",
    id: "clearButtonText",
    type: "Text",
    text: "↺ Clear",
    style: {
      color: { type: "theme", name: "text" },
      fontSize: 16,
      fontWeight: 600,
    },
  });
  events.push({
    event: "addChild",
    parentId: "clearButton",
    childId: "clearButtonText",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 4C. RESET BUTTON (resets current step to beginning)
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "resetButton",
    type: "Selectable",
    style: {
      backgroundColor: { type: "theme", name: "primaryHover" },
      padding: 12,
      paddingLeft: 24,
      paddingRight: 24,
      borderRadius: 8,
    },
    onPress: [
      // Reset current step to 0
      {
        type: "setSharedValue",
        target: "currentStep",
        operation: "set",
        value: 0,
      },
      // Immediately set column scales: first column scaled up, others normal
      ...Array.from({ length: 16 }, (_, col) => ({
        type: "setSharedValue" as const,
        target: `columnScale_${col}`,
        operation: "set" as const,
        value: col === 0 ? 1.15 : 1.0,
      })),
    ],
  });
  events.push({
    event: "addChild",
    parentId: "controlsLeft",
    childId: "resetButton",
  });

  events.push({
    event: "createView",
    id: "resetButtonText",
    type: "Text",
    text: "⏮ Reset",
    style: {
      color: { type: "theme", name: "text" },
      fontSize: 16,
      fontWeight: 600,
    },
  });
  events.push({
    event: "addChild",
    parentId: "resetButton",
    childId: "resetButtonText",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 4D. RANDOMIZE BUTTON
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "randomButton",
    type: "Selectable",
    style: {
      backgroundColor: { type: "theme", name: "accent" },
      padding: 12,
      paddingLeft: 24,
      paddingRight: 24,
      borderRadius: 8,
    },
    onPress: [
      // Generate random values for all 96 cells (6 instruments × 16 steps)
      // Each cell gets a random value between 0-1, then we threshold to binary
      ...Array.from({ length: 6 * 16 }, (_, i) => {
        const row = Math.floor(i / 16);
        const col = i % 16;
        return {
          type: "setRandomValue" as const,
          target: `cell_${row}_${col}`,
          min: 0,
          max: 1, // Random value 0-1
        };
      }),
      // Convert random values to binary: if >= 0.7, set to 1, otherwise 0
      // This gives us ~30% probability of a beat on each step
      ...Array.from({ length: 6 * 16 }, (_, i) => {
        const row = Math.floor(i / 16);
        const col = i % 16;
        return {
          type: "conditional" as const,
          condition: {
            left: { type: "sharedRef" as const, ref: `cell_${row}_${col}` },
            op: ">=" as const,
            right: 0.7,
          },
          then: [
            {
              type: "setSharedValue" as const,
              target: `cell_${row}_${col}`,
              operation: "set" as const,
              value: 1,
            },
          ],
          else: [
            {
              type: "setSharedValue" as const,
              target: `cell_${row}_${col}`,
              operation: "set" as const,
              value: 0,
            },
          ],
        };
      }),
    ],
  });
  events.push({
    event: "addChild",
    parentId: "controlsLeft",
    childId: "randomButton",
  });

  events.push({
    event: "createView",
    id: "randomButtonText",
    type: "Text",
    text: "🎲 Randomize",
    style: {
      color: { type: "theme", name: "text" },
      fontSize: 16,
      fontWeight: 600,
    },
  });
  events.push({
    event: "addChild",
    parentId: "randomButton",
    childId: "randomButtonText",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 4D. SLIDERS CONTAINER (Right side)
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "slidersContainer",
    type: "View",
    style: {
      flexDirection: "row",
      gap: 24,
    },
  });
  events.push({
    event: "addChild",
    parentId: "controls",
    childId: "slidersContainer",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 4E. BPM SLIDER
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "bpmSlider",
    type: "View",
    style: {
      gap: 4,
    },
  });
  events.push({
    event: "addChild",
    parentId: "slidersContainer",
    childId: "bpmSlider",
  });

  // BPM Label
  events.push({
    event: "createView",
    id: "bpmLabel",
    type: "Text",
    text: "BPM: {{bpm}}", // Dynamic text that updates with shared value
    style: {
      color: { type: "theme", name: "text" },
      fontSize: 14,
      fontWeight: 600,
    },
  });
  events.push({
    event: "addChild",
    parentId: "bpmSlider",
    childId: "bpmLabel",
  });

  // BPM Slider container (for better touch target)
  events.push({
    event: "createView",
    id: "bpmSliderContainer",
    type: "View",
    style: {
      width: 128,
      height: 24,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    onPanGestureStart: [
      {
        type: "setSharedValue",
        target: "bpmSliderDrag",
        operation: "set",
        value: { type: "sharedRef", ref: "bpm" }, // Store starting BPM
      },
    ],
    onPanGestureChange: [
      {
        type: "setSharedValue",
        target: "bpm",
        operation: "set",
        value: {
          type: "computed",
          op: "clamp",
          args: [
            {
              type: "computed",
              op: "add",
              args: [
                { type: "sharedRef", ref: "bpmSliderDrag" },
                {
                  type: "computed",
                  op: "mul",
                  args: [
                    {
                      type: "computed",
                      op: "div",
                      args: ["translationX", 104], // Use actual thumb travel distance (128 - 20 - 4)
                    },
                    120, // Range: 60-180 = 120
                  ],
                },
              ],
            },
            60, // clamp min
            180, // clamp max
          ],
        },
      },
    ],
  });
  events.push({
    event: "addChild",
    parentId: "bpmSlider",
    childId: "bpmSliderContainer",
  });

  // BPM Slider track - rounded pill shape
  events.push({
    event: "createView",
    id: "bpmSliderTrack",
    type: "View",
    style: {
      width: 128,
      height: 24,
      backgroundColor: { type: "theme", name: "background" },
      borderRadius: 12,
      padding: 2, // Add padding so thumb doesn't touch edges
      justifyContent: "center",
    },
  });
  events.push({
    event: "addChild",
    parentId: "bpmSliderContainer",
    childId: "bpmSliderTrack",
  });

  // BPM Slider thumb (inside track, positioned absolutely)
  events.push({
    event: "createView",
    id: "bpmSliderThumb",
    type: "View",
    style: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: { type: "theme", name: "primary" },
      transform: {
        translateX: {
          bind: {
            type: "computed",
            op: "clamp",
            args: [
              {
                type: "computed",
                op: "mul",
                args: [
                  {
                    type: "computed",
                    op: "div",
                    args: [
                      {
                        type: "computed",
                        op: "sub",
                        args: [{ type: "sharedRef", ref: "bpm" }, 60],
                      },
                      120,
                    ],
                  },
                  104, // track width - thumb width - padding (128 - 20 - 4)
                ],
              },
              0, // min position
              104, // max position
            ],
          },
        },
      },
    },
  });
  events.push({
    event: "addChild",
    parentId: "bpmSliderTrack",
    childId: "bpmSliderThumb",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 4F. VOLUME SLIDER (similar to BPM)
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "volumeSlider",
    type: "View",
    style: {
      gap: 4,
    },
  });
  events.push({
    event: "addChild",
    parentId: "slidersContainer",
    childId: "volumeSlider",
  });

  // Volume Label - manually compute percentage from 0-1 value
  events.push({
    event: "createView",
    id: "volumeLabel",
    type: "Text",
    text: "Volume: {{volume*100}}%", // Multiply volume by 100 to show as percentage
    style: {
      color: { type: "theme", name: "accent" },
      fontSize: 14,
      fontWeight: 600,
    },
  });
  events.push({
    event: "addChild",
    parentId: "volumeSlider",
    childId: "volumeLabel",
  });

  // Volume Slider container (for better touch target)
  events.push({
    event: "createView",
    id: "volumeSliderContainer",
    type: "View",
    style: {
      width: 128,
      height: 24,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    onPanGestureStart: [
      {
        type: "setSharedValue",
        target: "volumeSliderDrag",
        operation: "set",
        value: { type: "sharedRef", ref: "volume" }, // Store starting volume
      },
    ],
    onPanGestureChange: [
      {
        type: "setSharedValue",
        target: "volume",
        operation: "set",
        value: {
          type: "computed",
          op: "clamp",
          args: [
            {
              type: "computed",
              op: "add",
              args: [
                { type: "sharedRef", ref: "volumeSliderDrag" },
                {
                  type: "computed",
                  op: "div",
                  args: ["translationX", 104], // Use actual thumb travel distance (128 - 20 - 4)
                },
              ],
            },
            0, // clamp min
            1, // clamp max (will be displayed as 100%)
          ],
        },
      },
    ],
  });
  events.push({
    event: "addChild",
    parentId: "volumeSlider",
    childId: "volumeSliderContainer",
  });

  // Volume Slider track - rounded pill shape
  events.push({
    event: "createView",
    id: "volumeSliderTrack",
    type: "View",
    style: {
      width: 128,
      height: 24,
      backgroundColor: { type: "theme", name: "background" },
      borderRadius: 12,
      padding: 2, // Add padding so thumb doesn't touch edges
      justifyContent: "center",
    },
  });
  events.push({
    event: "addChild",
    parentId: "volumeSliderContainer",
    childId: "volumeSliderTrack",
  });

  // Volume Slider thumb (inside track, positioned absolutely)
  events.push({
    event: "createView",
    id: "volumeSliderThumb",
    type: "View",
    style: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: { type: "theme", name: "primary" },
      transform: {
        translateX: {
          bind: {
            type: "computed",
            op: "clamp",
            args: [
              {
                type: "computed",
                op: "mul",
                args: [{ type: "sharedRef", ref: "volume" }, 104], // 0-1 range * (128 - 20 - 4)
              },
              0, // min position
              104, // max position
            ],
          },
        },
      },
    },
  });
  events.push({
    event: "addChild",
    parentId: "volumeSliderTrack",
    childId: "volumeSliderThumb",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 5. GRID CONTAINER - Beat sequencer
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "gridContainer",
    type: "View",
    style: {
      backgroundColor: { type: "theme", name: "surface" },
      borderRadius: 12,
      padding: 24,
    },
  });
  events.push({
    event: "addChild",
    parentId: "content",
    childId: "gridContainer",
  });

  // ──────────────────────────────────────────────────────────────────────
  // 5A. GENERATE INSTRUMENT ROWS
  // ──────────────────────────────────────────────────────────────────────

  instruments.forEach((instrument, rowIndex) => {
    // Row container
    const rowId = `row_${rowIndex}`;
    events.push({
      event: "createView",
      id: rowId,
      type: "View",
      style: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: rowIndex < 5 ? 8 : 0,
      },
    });
    events.push({
      event: "addChild",
      parentId: "gridContainer",
      childId: rowId,
    });

    // Instrument label
    events.push({
      event: "createView",
      id: `label_${rowIndex}`,
      type: "Text",
      text: instrument.name,
      style: {
        width: 60,
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 600,
      },
    });
    events.push({
      event: "addChild",
      parentId: rowId,
      childId: `label_${rowIndex}`,
    });

    // 16 step cells
    for (let col = 0; col < 16; col++) {
      const cellId = `cell_${rowIndex}_${col}`;
      const cellViewId = `cellView_${rowIndex}_${col}`;

      events.push({
        event: "createView",
        id: cellViewId,
        type: "Selectable",
        style: {
          width: 40,
          height: 40,
          borderRadius: 4,
          // Background color: inactive (gray) -> active (instrument color)
          backgroundColor: {
            bind: {
              type: "computed",
              op: "interpolateColor",
              args: [
                { type: "sharedRef", ref: cellId },
                [0, 1],
                [{ type: "theme", name: "background" }, instrument.color],
              ],
            },
          },
          // Scale up when this column is the current step (animated)
          transform: {
            scale: {
              bind: {
                type: "sharedRef",
                ref: `columnScale_${col}`,
              },
            },
          },
          // Highlight every 4th step (beat markers)
          marginLeft: col % 4 === 0 ? 4 : 0,
        },
        onPress: [
          // Toggle cell state
          {
            type: "setSharedValue",
            target: cellId,
            operation: "set",
            value: {
              type: "computed",
              op: "sub",
              args: [1, { type: "sharedRef", ref: cellId }], // Toggle: 1 - current
            },
          },
          // Play sound preview
          {
            type: "playSound",
            soundId: instrument.soundId,
            volume: { type: "sharedRef", ref: "volume" },
          },
        ],
      });
      events.push({ event: "addChild", parentId: rowId, childId: cellViewId });
    }
  });

  // ──────────────────────────────────────────────────────────────────────
  // 6. TIP TEXT
  // ──────────────────────────────────────────────────────────────────────

  events.push({
    event: "createView",
    id: "tip",
    type: "Text",
    text: "💡 Tip: Each column represents a 16th note. Columns are grouped by beat (4 steps per beat)",
    style: {
      color: { type: "theme", name: "accent" },
      fontSize: 14,
      marginTop: 24,
    },
  });
  events.push({ event: "addChild", parentId: "content", childId: "tip" });

  return events;
}

// ============================================================================
// USAGE EXAMPLE - How the server would respond to an LLM request
// ============================================================================

/**
 * Example server endpoint that an LLM would call:
 *
 * POST /api/generate-ui
 * {
 *   "description": "Create a beat maker with 6 instruments, 16 steps,
 *                   play/pause controls, BPM slider, and visual feedback"
 * }
 *
 * Response:
 * {
 *   "events": [...], // The events array from generateCompleteBeatMaker()
 *   "sounds": [...], // The beatMakerSounds array
 *   "collections": [
 *     {
 *       "key": "beatPatterns",
 *       "shape": { "name": "string", "grid": "object", "bpm": "number" }
 *     }
 *   ]
 * }
 */

export function serverEndpointHandler(description: string) {
  // LLM would analyze the description and generate appropriate events
  // For now, we just return the complete beat maker

  return {
    id: "beat-maker-v1",
    sounds: beatMakerSounds,
    events: generateCompleteBeatMaker(),
    collections: [
      {
        key: "beatPatterns",
        shape: {
          id: "string",
          name: "string",
          bpm: "number",
          grid: "object", // Store the 6x16 boolean grid
          createdAt: "number",
        },
      },
    ],
    metadata: {
      generatedAt: Date.now(),
      description,
      features: [
        "6 instruments with different sounds",
        "16-step sequencer",
        "Play/Pause/Clear/Randomize controls",
        "BPM control (60-180)",
        "Volume control (0-100%)",
        "Visual feedback on current step",
        "Smooth animations",
        "Touch/click cell toggling",
      ],
    },
  };
}
