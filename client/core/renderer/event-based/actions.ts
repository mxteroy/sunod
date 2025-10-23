import { Easing, runOnUI, withTiming } from "react-native-reanimated";
import type { StoreApi, UseBoundStore } from "zustand";
import type { SpaceStore } from "../../store";
import type { SVMap } from "../FullSchemaRenderer";

/**
 * Evaluates computed values, shared references, and mathematical operations
 * Runs in worklet context for performance
 */
export function evalComputedValue(
  value: any,
  map: SVMap,
  eventData: Record<string, number>
): number {
  "worklet";
  if (typeof value === "number") return value;
  if (typeof value === "string") return eventData[value] ?? 0;

  if (value.type === "sharedRef") {
    const sv = map[value.ref];
    return sv ? (typeof sv.value === "number" ? sv.value : 0) : 0;
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
      default:
        return 0;
    }
  }

  return 0;
}

/**
 * Executes a single action (shared values, animations, conditionals, logging)
 * Runs in worklet context
 */
export function executeAction(
  action: any,
  map: SVMap,
  eventData: Record<string, number>
) {
  "worklet";

  switch (action.type) {
    case "setSharedValue": {
      const target = map[action.target];
      if (!target) return;

      const computedValue = evalComputedValue(action.value, map, eventData);

      switch (action.operation) {
        case "add":
          target.value += computedValue;
          break;
        case "sub":
          target.value -= computedValue;
          break;
        case "mul":
          target.value *= computedValue;
          break;
        case "div":
          if (computedValue !== 0) {
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
        executeAction(a, map, eventData);
      }
      break;
    }

    case "animate": {
      const target = map[action.target];
      if (!target) return;

      const toValue = evalComputedValue(action.to, map, eventData);
      const duration = action.duration || 300;

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

    case "createRecord":
    case "updateRecord":
    case "deleteRecord":
      // These actions need to run outside worklet context
      // They will be handled by executeHandlerWithStore
      console.warn(
        `Data action ${action.type} called in worklet context - use executeHandlerWithStore instead`
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
  eventData: Record<string, number>
) {
  "worklet";
  for (const action of handler) {
    executeAction(action, map, eventData);
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
  itemVar?: string
) {
  for (const action of handler) {
    if (!action || !action.type) continue;

    // Handle data actions that need store access
    if (
      action.type === "createRecord" ||
      action.type === "updateRecord" ||
      action.type === "deleteRecord"
    ) {
      if (!store) {
        console.warn(`${action.type} requires store but none provided`);
        continue;
      }

      const storeState = store.getState();

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
        storeState.createRecord(action.collection, resolvedRecord);
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
        storeState.updateRecord(action.collection, resolvedId, resolvedPatch);
      } else if (action.type === "deleteRecord") {
        // Resolve template string in ID (e.g., {{todo.id}})
        const resolvedId = resolveActionValue(action.id, itemContext, itemVar);
        storeState.deleteRecord(action.collection, resolvedId);
        console.log(
          "Deleting record from collection",
          action.collection,
          resolvedId
        );
      }
    } else {
      // For other actions, run them in worklet context
      runOnUI(() => {
        "worklet";
        executeAction(action, map, eventData);
      })();
    }
  }
}
