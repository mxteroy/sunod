import {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  runOnUI,
  withTiming,
} from "react-native-reanimated";
import type { StoreApi, UseBoundStore } from "zustand";
import { getAudioManager } from "../../audio/AudioManager";
import { triggerSoundFromWorklet } from "../../audio/WorkletAudioBridge";
import type { SpaceStore } from "../../store";
import type { SVMap } from "../FullSchemaRenderer";

/**
 * Evaluates computed values, shared references, and mathematical operations
 * Runs in worklet context for performance
 * Returns number or string (for colors)
 */
export function evalComputedValue(
  value: any,
  map: SVMap,
  eventData: Record<string, number>
): number | string {
  "worklet";
  if (typeof value === "number") return value;
  if (typeof value === "string") return eventData[value] ?? 0;

  if (value.type === "sharedRef") {
    const sv = map[value.ref];
    return sv ? (typeof sv.value === "number" ? sv.value : 0) : 0;
  }

  if (value.type === "cond") {
    // Handle conditional expressions: { type: "cond", if: {...}, then: ..., else: ... }
    const left = evalComputedValue(value.if.left, map, eventData);
    const right = evalComputedValue(value.if.right, map, eventData);

    let conditionMet = false;
    switch (value.if.op) {
      case ">":
        conditionMet = left > right;
        break;
      case ">=":
        conditionMet = left >= right;
        break;
      case "<":
        conditionMet = left < right;
        break;
      case "<=":
        conditionMet = left <= right;
        break;
      case "==":
        conditionMet = left === right;
        break;
      case "!=":
        conditionMet = left !== right;
        break;
    }

    return conditionMet
      ? evalComputedValue(value.then, map, eventData)
      : evalComputedValue(value.else, map, eventData);
  }

  if (value.type === "computed") {
    const args = value.args.map((arg: any) => {
      return evalComputedValue(arg, map, eventData);
    });

    switch (value.op) {
      case "add":
        return args.reduce((a: number, b: number) => a + b, 0);
      case "sub":
        return args
          .slice(1)
          .reduce((a: number, b: number) => a - b, args[0] ?? 0);
      case "mul":
        return args.reduce((a: number, b: number) => a * b, 1);
      case "div":
        return args
          .slice(1)
          .reduce(
            (a: number, b: number) => a / (b === 0 ? 1 : b),
            args[0] ?? 0
          );
      case "mod": {
        const [x, y] = [args[0] ?? 0, args[1] ?? 1];
        return ((x % y) + y) % y; // Handle negative modulo correctly
      }
      case "clamp": {
        const [x, min, max] = [args[0] ?? 0, args[1] ?? 0, args[2] ?? 1];
        return Math.min(Math.max(x, min), max);
      }
      case "lerp": {
        const [a, b, t] = [args[0] ?? 0, args[1] ?? 0, args[2] ?? 0];
        return a + (b - a) * t;
      }
      case "min":
        return Math.min(...args);
      case "max":
        return Math.max(...args);
      case "interpolate": {
        // interpolate(input, inputRange, outputRange)
        // args[0] = input value
        // args[1] = array of input range values (must be raw array in schema)
        // args[2] = array of output range values (must be raw array in schema)
        const input = args[0] ?? 0;
        const inputRange = value.args[1]; // Get raw array from schema
        const outputRange = value.args[2]; // Get raw array from schema
        return interpolate(input, inputRange, outputRange);
      }
      case "interpolateColor": {
        // interpolateColor(input, inputRange, colorRange)
        const input = args[0] ?? 0;
        const inputRange = value.args[1]; // Get raw array from schema
        const colorRange = value.args[2]; // Get raw array from schema (already resolved by useResolvedStyleColors)
        return interpolateColor(input, inputRange, colorRange);
      }
      default:
        return 0;
    }
  }

  return 0;
}

/**
 * Executes a single action (shared values, animations, conditionals, logging)
 * Runs in worklet context
 * @param appId - App identifier for audio namespacing (passed through from parent)
 */
export function executeAction(
  action: any,
  map: SVMap,
  eventData: Record<string, number>,
  appId: string = "default"
) {
  "worklet";

  switch (action.type) {
    case "setSharedValue": {
      const target = map[action.target];
      if (!target) return;

      const computedValue = evalComputedValue(action.value, map, eventData);

      switch (action.operation) {
        case "add":
          if (typeof computedValue === "number") {
            target.value += computedValue;
          }
          break;
        case "sub":
          if (typeof computedValue === "number") {
            target.value -= computedValue;
          }
          break;
        case "mul":
          if (typeof computedValue === "number") {
            target.value *= computedValue;
          }
          break;
        case "div":
          if (typeof computedValue === "number" && computedValue !== 0) {
            target.value /= computedValue;
          }
          break;
        case "set":
          target.value = computedValue;
          break;
      }
      break;
    }

    case "log": {
      const message = action.message || "Log:";
      if (action.values) {
        const resolvedValues = action.values.map((v: any) => {
          if (typeof v === "number" || typeof v === "string") return v;
          if (v.type === "sharedRef") {
            const sv = map[v.ref];
            return sv ? sv.value : undefined;
          }
          return v;
        });
        console.log(message, ...resolvedValues);
      } else {
        console.log(message);
      }
      break;
    }

    case "conditional": {
      const left = evalComputedValue(action.condition.left, map, eventData);
      const right = evalComputedValue(action.condition.right, map, eventData);

      let conditionMet = false;
      switch (action.condition.op) {
        case ">":
          conditionMet = left > right;
          break;
        case ">=":
          conditionMet = left >= right;
          break;
        case "<":
          conditionMet = left < right;
          break;
        case "<=":
          conditionMet = left <= right;
          break;
        case "==":
          conditionMet = left === right;
          break;
        case "!=":
          conditionMet = left !== right;
          break;
      }

      const actionsToExecute = conditionMet ? action.then : action.else || [];
      for (const a of actionsToExecute) {
        executeAction(a, map, eventData, appId);
      }
      break;
    }

    case "animate": {
      const target = map[action.target];
      if (!target) {
        console.log("Animate: target not found", action.target);
        return;
      }

      const toValue = evalComputedValue(action.to, map, eventData);
      const duration = action.duration || 300;

      console.log(
        "Animating:",
        action.target,
        "from",
        target.value,
        "to",
        toValue,
        "duration",
        duration
      );

      let easing = Easing.inOut(Easing.ease);
      switch (action.easing) {
        case "linear":
          easing = Easing.linear;
          break;
        case "easeIn":
          easing = Easing.in(Easing.ease);
          break;
        case "easeOut":
          easing = Easing.out(Easing.ease);
          break;
        case "easeInOut":
          easing = Easing.inOut(Easing.ease);
          break;
        case "spring":
          target.value = withTiming(toValue, { duration: duration / 2 });
          return;
      }

      target.value = withTiming(toValue, { duration, easing });
      break;
    }

    case "playSound": {
      // Play sound from worklet context using the worklet audio bridge
      // This is ultra-fast - just writes to a shared queue (~1ms)
      const volume =
        typeof action.volume === "number"
          ? action.volume
          : action.volume
            ? evalComputedValue(action.volume, map, eventData)
            : 1;
      const pitch =
        typeof action.pitch === "number"
          ? action.pitch
          : action.pitch
            ? evalComputedValue(action.pitch, map, eventData)
            : 1;

      // Call worklet-safe trigger function (runs directly on UI thread)
      triggerSoundFromWorklet(
        action.soundId,
        typeof volume === "number" ? volume : 1,
        typeof pitch === "number" ? pitch : 1,
        appId
      );
      break;
    }

    case "startTimer": {
      // Start timer from worklet context
      const intervalValue = action.interval;
      const useWorklet = action.worklet === true;

      if (useWorklet) {
        // For worklet timers, we set up the timer on JS thread but pass worklet callback
        const workletCallback = () => {
          "worklet";
          for (const a of action.actions) {
            executeAction(a, map, eventData, appId);
          }
        };

        // Create a dynamic interval function if the interval depends on shared values
        // This allows the timer to automatically adjust when shared values change
        const isDynamicInterval =
          typeof intervalValue === "object" &&
          intervalValue.type === "computed";

        if (isDynamicInterval) {
          // Pass a function that evaluates the interval each tick
          const intervalFn = () => {
            "worklet";
            const computed = evalComputedValue(intervalValue, map, eventData);
            return typeof computed === "number" ? computed : 1000;
          };

          // Call AudioManager on JS thread to set up the worklet timer with dynamic interval
          runOnJS(
            (
              timerId: string,
              intervalFunc: () => number,
              callback: any,
              appId: string
            ) => {
              const audioManager = getAudioManager();
              audioManager.startTimer(
                timerId,
                intervalFunc,
                callback,
                true,
                appId
              );
            }
          )(action.timerId, intervalFn, workletCallback, appId);
        } else {
          // Static interval - evaluate once
          const interval = evalComputedValue(intervalValue, map, eventData);
          runOnJS(
            (
              timerId: string,
              intervalMs: number,
              callback: any,
              appId: string
            ) => {
              const audioManager = getAudioManager();
              audioManager.startTimer(
                timerId,
                intervalMs,
                callback,
                true,
                appId
              );
            }
          )(
            action.timerId,
            typeof interval === "number" ? interval : 1000,
            workletCallback,
            appId
          );
        }
      } else {
        // For JS timers, set up on JS thread with JS callback
        // Note: JS timers don't support dynamic intervals
        const interval = evalComputedValue(intervalValue, map, eventData);
        runOnJS(
          (timerId: string, intervalMs: number, acts: any[], appId: string) => {
            const audioManager = getAudioManager();
            audioManager.startTimer(
              timerId,
              intervalMs,
              () => {
                // Execute actions on JS thread
                for (const a of acts) {
                  // This will run on JS thread, so we need to use runOnUI for worklet actions
                  runOnUI(() => {
                    "worklet";
                    executeAction(a, map, eventData, appId);
                  })();
                }
              },
              false,
              appId
            );
          }
        )(
          action.timerId,
          typeof interval === "number" ? interval : 1000,
          action.actions,
          appId
        );
      }
      break;
    }

    case "stopTimer": {
      // Stop timer from worklet context
      runOnJS((timerId: string, appId: string) => {
        const audioManager = getAudioManager();
        const namespacedTimerId = `${appId}:${timerId}`;
        audioManager.stopTimer(namespacedTimerId);
      })(action.timerId, appId);
      break;
    }

    case "setRandomValue": {
      // Generate random value and store in shared value
      const target = map[action.target];
      if (!target) {
        console.warn("setRandomValue: target not found", action.target);
        return;
      }
      const min = action.min ?? 0;
      const max = action.max ?? 1;
      // Generate random number in range [min, max)
      const randomValue = Math.random() * (max - min) + min;
      target.value = randomValue;
      break;
    }

    case "createRecord":
    case "updateRecord":
    case "deleteRecord":
      // These actions CANNOT run in worklet context
      // They should only be in onPress/onPressIn/onPressOut handlers that use executeHandlerWithStore
      console.error(
        `❌ Action ${action.type} called in worklet context!`,
        "These operations must use executeHandlerWithStore (e.g., in onPress handlers).",
        "onSelectableStateChange/onHoverIn/onHoverOut run in worklets and cannot perform these operations."
      );
      break;
  }
}

/**
 * Executes an array of actions in worklet context
 */
export function executeHandler(
  handler: any[],
  map: SVMap,
  eventData: Record<string, number>,
  appId: string = "default"
) {
  "worklet";
  console.log(
    "executeHandler called with",
    handler.length,
    "actions",
    eventData
  );
  for (const action of handler) {
    console.log("Executing action:", action.type);
    executeAction(action, map, eventData, appId);
  }
}

/**
 * Resolves a value that might contain template strings
 * Used to resolve action parameters like {{todo.id}}
 */
function resolveActionValue(
  value: any,
  itemContext?: any,
  itemVar?: string
): any {
  if (typeof value !== "string") return value;
  if (!itemContext || !itemVar) return value;

  // Simple template string resolution: {{itemVar.field}}
  return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();

    // Handle simple paths like "todo.id" or "item.title"
    if (trimmedPath.startsWith(`${itemVar}.`)) {
      const field = trimmedPath.substring(itemVar.length + 1);
      const resolvedValue = itemContext[field];
      return resolvedValue !== undefined ? String(resolvedValue) : match;
    }

    return match;
  });
}

/**
 * Non-worklet version that can handle data actions
 * Used for button presses and other UI interactions that need store access
 */
export function executeHandlerWithStore(
  handler: any[],
  map: SVMap,
  eventData: Record<string, number>,
  store?: UseBoundStore<StoreApi<SpaceStore>>,
  itemContext?: any,
  itemVar?: string,
  appId: string = "default" // Add appId parameter
) {
  for (const action of handler) {
    if (!action || !action.type) continue;

    // Handle data actions that need store access
    if (
      action.type === "createRecord" ||
      action.type === "updateRecord" ||
      action.type === "deleteRecord" ||
      action.type === "playSound" ||
      action.type === "startTimer" ||
      action.type === "stopTimer"
    ) {
      if (
        (action.type === "createRecord" ||
          action.type === "updateRecord" ||
          action.type === "deleteRecord") &&
        !store
      ) {
        console.warn(`${action.type} requires store but none provided`);
        continue;
      }

      const storeState = store?.getState();

      if (action.type === "createRecord") {
        const record = action.record || {};
        // Resolve any template strings in the record
        const resolvedRecord: any = {};
        for (const key in record) {
          resolvedRecord[key] = resolveActionValue(
            record[key],
            itemContext,
            itemVar
          );
        }
        storeState!.createRecord(action.collection, resolvedRecord);
        console.log(
          "Created record in collection",
          action.collection,
          resolvedRecord
        );
      } else if (action.type === "updateRecord") {
        const patch = action.patch || {};
        // Resolve any template strings in the patch
        const resolvedPatch: any = {};
        for (const key in patch) {
          resolvedPatch[key] = resolveActionValue(
            patch[key],
            itemContext,
            itemVar
          );
        }
        const resolvedId = resolveActionValue(action.id, itemContext, itemVar);
        storeState!.updateRecord(action.collection, resolvedId, resolvedPatch);
      } else if (action.type === "deleteRecord") {
        // Resolve template string in ID (e.g., {{todo.id}})
        const resolvedId = resolveActionValue(action.id, itemContext, itemVar);
        storeState!.deleteRecord(action.collection, resolvedId);
        console.log(
          "Deleting record from collection",
          action.collection,
          resolvedId
        );
      } else if (action.type === "playSound") {
        // Audio action - play sound
        const audioManager = getAudioManager();
        const volume =
          typeof action.volume === "number"
            ? action.volume
            : action.volume
              ? evalComputedValue(action.volume, map, eventData)
              : 1;
        const pitch =
          typeof action.pitch === "number"
            ? action.pitch
            : action.pitch
              ? evalComputedValue(action.pitch, map, eventData)
              : 1;
        audioManager.playSound(
          action.soundId,
          typeof volume === "number" ? volume : 1,
          typeof pitch === "number" ? pitch : 1,
          appId // Pass appId for namespacing
        );
      } else if (action.type === "startTimer") {
        // Timer action - start interval
        const audioManager = getAudioManager();
        const intervalValue = action.interval;
        const useWorklet = action.worklet === true;

        // Check if interval is dynamic (depends on shared values)
        const isDynamicInterval =
          typeof intervalValue === "object" &&
          intervalValue.type === "computed";

        if (useWorklet) {
          // For worklet timers, we need to pass a worklet callback directly
          // The callback will run on UI thread automatically via setAnimatedInterval
          const workletCallback = () => {
            "worklet";
            for (const a of action.actions) {
              executeAction(a, map, eventData, appId);
            }
          };

          if (isDynamicInterval) {
            // Create a dynamic interval function that evaluates on each tick
            const intervalFn = () => {
              "worklet";
              const computed = evalComputedValue(intervalValue, map, eventData);
              return typeof computed === "number" ? computed : 1000;
            };

            audioManager.startTimer(
              action.timerId,
              intervalFn,
              workletCallback,
              true, // useWorklet
              appId // Pass appId for namespacing
            );
          } else {
            // Static interval
            const interval = evalComputedValue(intervalValue, map, eventData);
            audioManager.startTimer(
              action.timerId,
              typeof interval === "number" ? interval : 1000,
              workletCallback,
              true, // useWorklet
              appId // Pass appId for namespacing
            );
          }
        } else {
          // For JS thread timers, pass a regular callback
          // Note: Dynamic intervals not supported on JS thread
          const interval = evalComputedValue(intervalValue, map, eventData);
          const jsCallback = () => {
            executeHandlerWithStore(
              action.actions,
              map,
              eventData,
              store,
              itemContext,
              itemVar,
              appId // Pass appId through
            );
          };

          audioManager.startTimer(
            action.timerId,
            typeof interval === "number" ? interval : 1000,
            jsCallback,
            false, // JS thread
            appId // Pass appId for namespacing
          );
        }
      } else if (action.type === "stopTimer") {
        // Timer action - stop interval
        const audioManager = getAudioManager();
        const namespacedTimerId = `${appId}:${action.timerId}`;
        audioManager.stopTimer(namespacedTimerId);
      }
    } else if (action.type === "setRandomValue") {
      // Random value generation - can run on either thread
      const target = map[action.target];
      if (!target) {
        console.warn("setRandomValue: target not found", action.target);
        continue;
      }
      const min = action.min ?? 0;
      const max = action.max ?? 1;
      // Generate random number in range [min, max)
      const randomValue = Math.random() * (max - min) + min;
      runOnUI(() => {
        "worklet";
        target.value = randomValue;
      })();
    } else {
      // For other actions, run them in worklet context
      runOnUI(() => {
        "worklet";
        executeAction(action, map, eventData, appId);
      })();
    }
  }
}
