# Audio Runtime Architecture

## Overview

Our audio system is designed to support multiple execution contexts (runtimes) for optimal performance and flexibility. This document explains the runtime architecture and best practices.

## Execution Runtimes

### 1. **JS Runtime** (Main Thread)

- **Where**: Standard JavaScript event loop
- **Performance**: ~16ms budget (60fps)
- **Use Cases**:
  - Data operations (collections, state updates)
  - API calls and network requests
  - Complex business logic
  - Non-time-critical operations

```typescript
{
  type: "startTimer",
  timerId: "dataSync",
  interval: 1000,
  worklet: false, // Run on JS thread
  actions: [
    { type: "createRecord", collection: "logs", record: {...} }
  ]
}
```

### 2. **UIRuntime** (UI Thread via Reanimated)

- **Where**: Reanimated's UI thread worklet runtime
- **Performance**: ~16ms budget (60fps), but runs parallel to JS
- **Use Cases**:
  - UI animations synchronized with audio
  - Visual feedback for audio events
  - Shared value updates for smooth animations
  - Beat visualization

```typescript
{
  type: "startTimer",
  timerId: "beatAnimation",
  interval: 250, // 240 BPM
  worklet: true, // Run on UI thread
  actions: [
    { type: "setSharedValue", target: "currentStep", operation: "set", value: ... }
  ]
}
```

**Advantages**:

- Non-blocking to JS thread
- Direct access to Reanimated shared values
- Can trigger smooth 60fps animations
- Perfect for audio-visual synchronization

**Limitations**:

- Cannot access JS-only APIs
- Cannot modify collections directly
- No async/await support

### 3. **AudioRuntime** (Future - Audio Processing Thread)

- **Where**: react-native-audio-api's dedicated audio thread
- **Performance**: ~2.9ms budget @ 128 samples (44.1kHz)
- **Use Cases**:
  - Real-time audio processing
  - Audio effect chains
  - Sample-accurate timing
  - Low-latency audio generation

```typescript
// Future API (not yet implemented)
{
  type: "createAudioWorklet",
  workletId: "reverb",
  runtime: "audio", // AudioRuntime
  bufferLength: 128,
  process: (inputs, outputs) => {
    // Runs on audio thread at 44.1kHz
  }
}
```

**Advantages**:

- Lowest latency possible
- Sample-accurate processing
- No audio dropouts
- Direct access to audio buffers

**Limitations**:

- Extremely tight timing budget (~2.9ms @ 128 samples)
- Cannot access UI or shared values
- Must be highly optimized
- No blocking operations allowed

## Current Implementation

### Timer System

Our `startTimer` action supports two modes:

```typescript
// UI Thread Timer (for animations)
audioManager.startTimer(
  "sequencer",
  intervalMs,
  callback,
  true // useWorklet = true → UIRuntime
);

// JS Thread Timer (for data)
audioManager.startTimer(
  "dataSync",
  intervalMs,
  callback,
  false // useWorklet = false → JS Runtime
);
```

### Audio Playback

Currently uses `AudioContext` API which runs on its own thread:

- Sound synthesis happens off the main thread
- Minimal latency
- Shared between all audio operations

## Performance Considerations

### Buffer Sizing

When using worklets, consider the processing budget:

| Buffer Size  | Frequency | Time Budget @ 44.1kHz | Use Case                  |
| ------------ | --------- | --------------------- | ------------------------- |
| 128 samples  | ~344 Hz   | ~2.9ms                | Critical audio processing |
| 256 samples  | ~172 Hz   | ~5.8ms                | Standard audio worklets   |
| 512 samples  | ~86 Hz    | ~11.6ms               | Less critical processing  |
| 1024 samples | ~43 Hz    | ~23.2ms               | Visual feedback (>40fps)  |

### Recommendations

1. **For Beat Maker Sequencer (16th notes @ 120 BPM)**:
   - Interval: `60000 / 120 / 4 = 125ms`
   - Use **UIRuntime** (`worklet: true`)
   - Update shared values for visual feedback
   - Trigger audio playback (happens on audio thread automatically)

2. **For Visual Waveform Display**:
   - Use larger buffer (512-1024 samples)
   - Process on **UIRuntime**
   - Update at 40-60fps is sufficient

3. **For Data Logging/Analytics**:
   - Use **JS Runtime** (`worklet: false`)
   - Can batch operations
   - Non-critical timing

4. **For Future Real-time Audio Effects**:
   - Use **AudioRuntime** (when implemented)
   - Keep processing minimal
   - Optimize for <3ms execution

## Best Practices

### ✅ Do:

- Use UIRuntime for audio-visual sync (sequencer, animations)
- Use JS Runtime for data operations (collections, API calls)
- Measure performance and check for dropped frames
- Use appropriate buffer sizes for your use case
- Profile worklet execution time

### ❌ Don't:

- Don't use UIRuntime for API calls or complex logic
- Don't use JS Runtime for time-critical animations
- Don't create too many chained worklets (increases latency)
- Don't perform blocking operations in worklets
- Don't assume worklet execution is instantaneous

## Migration Path to AudioRuntime

When `react-native-audio-api` worklets become available, we can extend our system:

```typescript
// Schema extension
{
  type: "createAudioProcessor",
  processorId: "dynamicEQ",
  runtime: "audio", // New: AudioRuntime
  bufferLength: 256,
  workletCode: "...", // Worklet source code
  inputs: ["audioIn"],
  outputs: ["audioOut"]
}
```

This will enable:

- Custom audio effects (reverb, delay, filters)
- Real-time synthesis
- Audio analysis (FFT, beat detection)
- Sample-accurate MIDI timing

## Current Audio Flow

```
Schema Event (JS)
    ↓
Action Handler (JS)
    ↓
┌───────────────┐
│  startTimer   │
└───────┬───────┘
        │
    ┌───┴────┐
    │worklet?│
    └────┬───┘
         │
    ┌────┴────┐
    │   Yes   │────→ UIRuntime (Reanimated)
    │         │        • Update shared values
    │         │        • Trigger animations
    │         │        • Call playSound
    └─────────┘
         │
    ┌────┴────┐
    │   No    │────→ JS Runtime
    │         │        • Data operations
    │         │        • API calls
    │         │        • Call playSound
    └─────────┘
         │
         ↓
   playSound(id)
         ↓
   AudioContext (Native Audio Thread)
         ↓
   Speaker Output
```

## Example: Beat Maker Sequencer

```typescript
// Optimal configuration for 120 BPM, 16th notes
{
  event: "startTimer",
  timerId: "sequencer",
  interval: 125, // ms (120 BPM ÷ 4 = 480 16ths/min = 125ms per 16th)
  worklet: true, // Use UIRuntime for smooth visual updates
  actions: [
    // Update current step (runs on UI thread)
    {
      type: "setSharedValue",
      target: "currentStep",
      operation: "set",
      value: { type: "computed", op: "mod", args: [...] }
    },
    // Play sounds (triggers on audio thread automatically)
    {
      type: "conditional",
      condition: { /* check if cell is active */ },
      then: [{ type: "playSound", soundId: "kick" }]
    }
  ]
}
```

**Why this works**:

- 125ms interval is well above the worklet budget (~16ms)
- UIRuntime allows smooth shared value updates
- Visual feedback stays in sync with audio
- Audio playback happens on dedicated audio thread
- No dropped frames or glitches

## Future Enhancements

1. **AudioRuntime Support**: Add worklet nodes for real-time processing
2. **Buffer Management**: Automatic buffer size selection based on use case
3. **Performance Monitoring**: Built-in frame drop detection
4. **Worklet Templates**: Pre-optimized worklets for common patterns
5. **Runtime Selection**: Automatic runtime selection based on action types
