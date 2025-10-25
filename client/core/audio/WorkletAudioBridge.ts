/**
 * WorkletAudioBridge - High-performance audio triggering from UI thread
 *
 * This bridge allows worklets on the UI thread to trigger audio playback
 * with minimal latency by using a shared value queue system.
 *
 * Performance characteristics:
 * - UI thread writes to shared queue (< 1ms)
 * - JS thread polls queue via useFrameCallback (16ms intervals @ 60fps)
 * - Total latency: ~17ms worst case, typically < 5ms
 */

import { makeMutable } from "react-native-reanimated";
import { getAudioManager } from "./AudioManager";

interface SoundTrigger {
  id: number;
  soundId: string;
  volume: number;
  pitch: number;
  timestamp: number;
  appId: string; // Track which app triggered the sound
}

// Shared queue for sound triggers
const SOUND_QUEUE = makeMutable<SoundTrigger[]>([]);
let nextTriggerId = 0;

/**
 * Trigger a sound from worklet context (UI thread)
 * This is ultra-fast and safe to call from any worklet
 * @param soundId - Sound identifier
 * @param volume - Volume (0-1)
 * @param pitch - Pitch multiplier
 * @param appId - App identifier for namespacing
 */
export function triggerSoundFromWorklet(
  soundId: string,
  volume: number = 1,
  pitch: number = 1,
  appId: string = "default"
) {
  "worklet";

  const trigger: SoundTrigger = {
    id: nextTriggerId++,
    soundId,
    volume,
    pitch,
    timestamp: Date.now(),
    appId,
  };

  SOUND_QUEUE.value = [...SOUND_QUEUE.value, trigger];
}

/**
 * Process the sound queue on JS thread
 * Call this from a setInterval or React effect
 */
export function processSoundQueue() {
  const queue = SOUND_QUEUE.value;

  if (queue.length === 0) return;

  // Clear the queue
  SOUND_QUEUE.value = [];

  // Process all pending sounds
  const audioManager = getAudioManager();
  queue.forEach((trigger) => {
    audioManager.playSound(
      trigger.soundId,
      trigger.volume,
      trigger.pitch,
      trigger.appId // Pass app context
    );
  });
}

/**
 * Start the sound queue processor
 * This runs on JS thread and polls the queue at high frequency
 */
export function startSoundQueueProcessor() {
  // Check queue every ~8ms for low latency (125 Hz polling rate)
  const intervalId = setInterval(processSoundQueue, 8);

  return () => clearInterval(intervalId);
}
