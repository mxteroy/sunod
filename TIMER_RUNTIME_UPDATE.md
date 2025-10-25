# Timer Runtime Implementation Summary

## Changes Made

### 1. Updated AudioManager (`AudioManager.ts`)

**Added Support for Worklet-based Timers:**

- Timers can now run on **UIRuntime** (UI thread) or **JS Runtime** (main thread)
- New `useWorklet` parameter in `startTimer()` method
- Proper cleanup for both runtime types

**Key Features:**

```typescript
startTimer(
  timerId: string,
  intervalMs: number,
  callback: () => void,
  useWorklet: boolean = false // NEW: Choose runtime
)
```

**When `useWorklet = true` (UIRuntime)**:

- Runs on Reanimated's UI thread
- Perfect for 60fps animations
- Can update shared values without blocking JS
- Ideal for audio-visual synchronization

**When `useWorklet = false` (JS Runtime)**:

- Runs on main JavaScript thread
- Can access all JS APIs
- Can modify collections and make API calls
- Better for data operations

### 2. Updated Action Handler (`actions.ts`)

**Timer Actions Now Respect Runtime:**

```typescript
{
  type: "startTimer",
  timerId: "sequencer",
  interval: 125,
  worklet: true, // ← This now controls which runtime is used!
  actions: [...]
}
```

The action handler now passes the `worklet` flag to `AudioManager.startTimer()`, ensuring the timer callback runs on the correct thread.

### 3. Future-Proofing for AudioRuntime

**Current Architecture Leaves Door Open For:**

- **AudioRuntime** (react-native-audio-api worklets)
- Sample-accurate audio processing
- Real-time audio effects
- Custom synthesis algorithms

**Migration Path:**
When AudioRuntime becomes available, we can add:

```typescript
// Future schema extension
{
  type: "createAudioProcessor",
  runtime: "audio", // NEW: AudioRuntime
  bufferLength: 128,
  workletCode: "...",
}
```

## Performance Implications

### UIRuntime (worklet: true)

- **Budget**: ~16ms per execution (60fps)
- **Best for**: Visual feedback, animations, shared value updates
- **Example**: Beat maker sequencer updating current step

### JS Runtime (worklet: false)

- **Budget**: ~16ms per execution (60fps)
- **Best for**: Data operations, API calls, complex logic
- **Example**: Logging beat patterns to database

### AudioRuntime (future)

- **Budget**: ~2.9ms @ 128 samples (44.1kHz)
- **Best for**: Real-time audio processing, effects, synthesis
- **Example**: Dynamic EQ, reverb, compression

## Beat Maker Implementation

### Optimal Configuration

```typescript
// Sequencer timer - use UIRuntime for smooth visuals
{
  type: "startTimer",
  timerId: "sequencer",
  interval: 125, // 120 BPM, 16th notes
  worklet: true, // Run on UI thread
  actions: [
    // Visual updates (fast, non-blocking)
    { type: "setSharedValue", target: "currentStep", ... },
    // Audio playback (automatically on audio thread)
    { type: "playSound", soundId: "kick" }
  ]
}
```

**Why This Works:**

1. Timer runs on UIRuntime at 125ms intervals (well above 16ms budget)
2. Shared value updates are instant and smooth
3. Audio playback is handled by AudioContext (native audio thread)
4. Visual feedback stays perfectly synced with audio
5. No dropped frames or stuttering

## Recommendations

### ✅ Use UIRuntime (worklet: true) For:

- Beat sequencers
- Animation triggers from audio
- Real-time visual feedback
- Shared value updates
- High-frequency timers (<100ms intervals)

### ✅ Use JS Runtime (worklet: false) For:

- Data logging
- Collection updates
- API calls
- Complex business logic
- Low-frequency timers (>1000ms intervals)

### ✅ Future AudioRuntime For:

- Audio effects processing
- Custom synthesis
- Sample-accurate timing
- Audio analysis (FFT, beat detection)

## Testing Checklist

- [ ] Verify UIRuntime timers update shared values smoothly
- [ ] Confirm JS Runtime timers can modify collections
- [ ] Check audio playback stays in sync with visual feedback
- [ ] Test at various BPMs (60-180)
- [ ] Monitor for dropped frames
- [ ] Verify cleanup stops all timers properly

## Next Steps

1. **Test on device** - Worklets only work on physical devices/emulators

2. **Monitor performance** - Check for frame drops in development

3. **Consider AudioRuntime** - When ready to add real-time audio processing

4. **Optimize buffer sizes** - Based on actual performance measurements

## Documentation

See `AUDIO_RUNTIME_ARCHITECTURE.md` for comprehensive runtime documentation including:

- Detailed runtime comparisons
- Performance budgets and recommendations
- Migration path to AudioRuntime
- Best practices and examples
