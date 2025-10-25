/**
 * AudioManager - Cross-platform audio synthesis
 * Uses react-native-audio-api for Web Audio API compatibility
 * Supports worklet-based timers for UI/Audio thread execution
 */

import type { SoundDef } from "@shared/schema";
import { AudioContext } from "react-native-audio-api";
import { makeMutable, runOnUI } from "react-native-reanimated";
import {
  clearAnimatedInterval,
  setAnimatedInterval,
  type AnimatedIntervalID,
} from "../utils/animatedInterval";

type TimerCallback = () => void;

interface TimerConfig {
  callback: TimerCallback;
  intervalMs: number;
  isWorklet: boolean;
  handle?: ReturnType<typeof setInterval> | AnimatedIntervalID; // JS thread or UI thread timer
}

// Shared mutable map to store UI thread timer handles
const UI_TIMER_HANDLES = makeMutable<Record<string, AnimatedIntervalID>>({});

export class AudioManager {
  private context: AudioContext;
  private sounds: Map<string, SoundDef>; // All sounds across all apps
  private activeTimers: Map<string, TimerConfig>;
  private appSounds: Map<string, Set<string>>; // appId -> Set<soundId>
  private appTimers: Map<string, Set<string>>; // appId -> Set<timerId>

  constructor() {
    this.context = new AudioContext();
    this.sounds = new Map();
    this.activeTimers = new Map();
    this.appSounds = new Map();
    this.appTimers = new Map();
  }

  /**
   * Register sound definitions for a specific app
   * @param sounds - Array of sound definitions
   * @param appId - Unique identifier for the app (e.g., spaceId)
   */
  registerSounds(sounds: SoundDef[], appId: string = "default") {
    // Track which sounds belong to this app
    if (!this.appSounds.has(appId)) {
      this.appSounds.set(appId, new Set());
    }
    const appSoundSet = this.appSounds.get(appId)!;

    sounds.forEach((sound) => {
      // Namespace sound IDs by app to prevent collisions
      const namespacedId = `${appId}:${sound.id}`;
      this.sounds.set(namespacedId, sound);
      appSoundSet.add(namespacedId);
    });

    console.log(`📢 Registered ${sounds.length} sounds for app "${appId}"`);
  }

  /**
   * Play a sound by ID
   * @param soundId - Sound identifier (will be namespaced by appId)
   * @param volume - Volume (0-1)
   * @param pitchMultiplier - Pitch multiplier
   * @param appId - App identifier for namespacing
   */
  playSound(
    soundId: string,
    volume: number = 1,
    pitchMultiplier: number = 1,
    appId: string = "default"
  ) {
    // Try namespaced ID first, fallback to raw ID for backwards compatibility
    const namespacedId = `${appId}:${soundId}`;
    let soundDef = this.sounds.get(namespacedId);

    if (!soundDef) {
      soundDef = this.sounds.get(soundId);
    }

    if (!soundDef) {
      console.warn(`Sound not found: ${soundId} (app: ${appId})`);
      return;
    }

    const now = this.context.currentTime;
    const duration = soundDef.duration || 0.1;

    if (soundDef.type === "noise") {
      void this.playNoise(soundDef, now, volume, duration);
    } else {
      this.playOscillator(soundDef, now, volume, pitchMultiplier, duration);
    }
  }

  /**
   * Play noise-based sound (hi-hat, snare, clap)
   * Following react-native-audio-api patterns from documentation
   */
  private async playNoise(
    soundDef: SoundDef,
    startTime: number,
    volume: number,
    duration: number
  ) {
    try {
      // 1. Create AudioBuffer with white noise
      const bufferSize = Math.floor(this.context.sampleRate * duration);
      const buffer = this.context.createBuffer(
        1, // mono
        bufferSize,
        this.context.sampleRate
      );

      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // 2. Create nodes
      const noiseSource = await this.context.createBufferSource();
      const gainNode = this.context.createGain();

      // 3. Set buffer FIRST (before connecting!)
      noiseSource.buffer = buffer;

      // 4. Connect nodes AFTER setting buffer
      if (soundDef.filterType && soundDef.filterFrequency) {
        const filter = this.context.createBiquadFilter();
        filter.type = soundDef.filterType;
        filter.frequency.value = soundDef.filterFrequency;
        filter.Q.value = soundDef.filterQ || 1;

        // Chain: source -> filter -> gain -> destination
        noiseSource.connect(filter);
        filter.connect(gainNode);
      } else {
        // Chain: source -> gain -> destination
        noiseSource.connect(gainNode);
      }

      gainNode.connect(this.context.destination);

      // 5. Apply envelope
      this.applyEnvelope(gainNode, startTime, soundDef, volume, duration);

      // 6. Start playback
      noiseSource.start();

      console.log(
        `✅ Noise playing: ${soundDef.filterType || "unfiltered"} @ ${soundDef.filterFrequency || "N/A"}Hz`
      );
    } catch (error) {
      console.error("❌ Error playing noise:", error);
      console.error("Sound def:", soundDef);
    }
  }

  /**
   * Play oscillator-based sound (kick, tom, bass)
   * Following react-native-audio-api patterns
   */
  private playOscillator(
    soundDef: SoundDef,
    startTime: number,
    volume: number,
    pitchMultiplier: number,
    duration: number
  ) {
    try {
      const osc = this.context.createOscillator();
      osc.type = soundDef.oscillatorType || "sine";

      const frequency = (soundDef.frequency || 440) * pitchMultiplier;
      const gainNode = this.context.createGain();

      // Connect first
      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

      // Set frequency
      osc.frequency.setValueAtTime(frequency, startTime);

      // Apply envelope
      this.applyEnvelope(gainNode, startTime, soundDef, volume, duration);

      // Start (immediate, not scheduled)
      osc.start();

      console.log(
        `✅ Oscillator playing: ${soundDef.oscillatorType || "sine"} @ ${frequency}Hz`
      );
    } catch (error) {
      console.error("❌ Error playing oscillator:", error);
    }
  }

  /**
   * Apply ADSR envelope to gain node
   * Uses currentTime for immediate playback
   */
  private applyEnvelope(
    gainNode: any,
    startTime: number,
    soundDef: SoundDef,
    volume: number,
    duration: number
  ) {
    const now = this.context.currentTime;
    const attack = soundDef.attack || 0;
    const decay = soundDef.decay || 0;
    const sustain = soundDef.sustain || 1;
    const release = soundDef.release || 0.1;

    // Start from 0
    gainNode.gain.setValueAtTime(0, now);

    // Attack phase
    gainNode.gain.linearRampToValueAtTime(volume, now + attack);

    // Decay to sustain level
    if (decay > 0) {
      gainNode.gain.linearRampToValueAtTime(
        volume * sustain,
        now + attack + decay
      );
    }

    // Hold sustain until release
    const sustainEnd = now + duration - release;
    gainNode.gain.setValueAtTime(volume * sustain, sustainEnd);

    // Release phase - use linear ramp to avoid exponential issues
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
  }

  /**
   * Start a timer that executes a callback at regular intervals
   * @param timerId - Unique identifier for the timer
   * @param intervalMs - Interval in milliseconds (or function returning interval for dynamic intervals)
   * @param callback - Function to execute on each tick (must be worklet if useWorklet=true)
   * @param useWorklet - If true, runs on UI thread for 60fps animations; if false, runs on JS thread
   * @param appId - App identifier for cleanup tracking
   */
  startTimer(
    timerId: string,
    intervalMs: number | (() => number),
    callback: TimerCallback,
    useWorklet: boolean = false,
    appId: string = "default"
  ) {
    // Namespace timer ID by app to prevent collisions
    const namespacedTimerId = `${appId}:${timerId}`;

    // Track which timers belong to this app
    if (!this.appTimers.has(appId)) {
      this.appTimers.set(appId, new Set());
    }
    this.appTimers.get(appId)!.add(namespacedTimerId);

    // Clear existing timer if any
    this.stopTimer(namespacedTimerId);

    if (useWorklet) {
      // UI thread execution using animated interval with requestAnimationFrame
      // This creates a high-precision timer on the UI thread
      // Perfect for audio-visual synchronization

      // The callback is already a worklet, so we can pass it directly
      // Run the interval setup on UI thread
      runOnUI(() => {
        "worklet";

        const handle = setAnimatedInterval(callback, intervalMs);

        // Store handle in shared mutable so we can access it from JS thread
        UI_TIMER_HANDLES.modify((handles) => {
          "worklet";
          return { ...handles, [namespacedTimerId]: handle };
        });
      })();

      // Store config
      this.activeTimers.set(namespacedTimerId, {
        callback,
        intervalMs: typeof intervalMs === "number" ? intervalMs : 0,
        isWorklet: true,
      });
    } else {
      // JS thread execution (standard setInterval)
      // Use for non-critical timing or when interacting with JS-only APIs
      // Note: Dynamic intervals not supported on JS thread - will use initial value
      const staticInterval =
        typeof intervalMs === "function" ? intervalMs() : intervalMs;
      const handle = setInterval(callback, staticInterval);

      this.activeTimers.set(namespacedTimerId, {
        callback,
        intervalMs: staticInterval,
        isWorklet: false,
        handle,
      });
    }

    console.log(
      `⏱️  Started ${useWorklet ? "worklet" : "JS"} timer: ${namespacedTimerId}`
    );
  }

  /**
   * Stop a running timer
   */
  stopTimer(timerId: string) {
    const timerConfig = this.activeTimers.get(timerId);
    if (timerConfig) {
      if (timerConfig.isWorklet) {
        // Cancel UI thread timer
        runOnUI(() => {
          "worklet";
          const handle = UI_TIMER_HANDLES.value[timerId];
          if (handle !== undefined) {
            clearAnimatedInterval(handle);
            // Remove from map
            UI_TIMER_HANDLES.modify((handles) => {
              "worklet";
              const newHandles = { ...handles };
              delete newHandles[timerId];
              return newHandles;
            });
          }
        })();
      } else if (timerConfig.handle) {
        // Cancel JS thread timer
        clearInterval(timerConfig.handle as ReturnType<typeof setInterval>);
      }
      this.activeTimers.delete(timerId);
    }
  }

  /**
   * Cleanup all timers and close audio context
   */
  cleanup() {
    this.activeTimers.forEach((timerConfig, timerId) => {
      this.stopTimer(timerId);
    });
    this.activeTimers.clear();
    this.appTimers.clear();
    this.sounds.clear();
    this.appSounds.clear();
    if (this.context.state !== "closed") {
      this.context.close();
    }
  }

  /**
   * Cleanup resources for a specific app
   * Call this when unmounting an app or switching apps
   * @param appId - App identifier to cleanup
   */
  cleanupApp(appId: string) {
    console.log(`🧹 Cleaning up app: ${appId}`);

    // Stop all timers for this app
    const appTimerSet = this.appTimers.get(appId);
    if (appTimerSet) {
      appTimerSet.forEach((timerId) => {
        this.stopTimer(timerId);
      });
      this.appTimers.delete(appId);
    }

    // Remove all sounds for this app
    const appSoundSet = this.appSounds.get(appId);
    if (appSoundSet) {
      appSoundSet.forEach((soundId) => {
        this.sounds.delete(soundId);
      });
      this.appSounds.delete(appId);
    }

    console.log(`✅ App "${appId}" cleaned up successfully`);
  }

  /**
   * Get statistics about registered apps
   */
  getStats() {
    return {
      totalSounds: this.sounds.size,
      totalTimers: this.activeTimers.size,
      apps: Array.from(this.appSounds.keys()).map((appId) => ({
        appId,
        sounds: this.appSounds.get(appId)?.size || 0,
        timers: this.appTimers.get(appId)?.size || 0,
      })),
    };
  }
}

// Global singleton instance
let globalAudioManager: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!globalAudioManager) {
    globalAudioManager = new AudioManager();
  }
  return globalAudioManager;
}

export function cleanupAudioManager() {
  if (globalAudioManager) {
    globalAudioManager.cleanup();
    globalAudioManager = null;
  }
}
