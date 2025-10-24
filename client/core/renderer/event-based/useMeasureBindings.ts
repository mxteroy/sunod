import { useEffect } from "react";
import {
  measure,
  runOnUI,
  useAnimatedRef,
  useFrameCallback,
} from "react-native-reanimated";
import type { SVMap } from "../FullSchemaRenderer";
import type { NodeState } from "./types";

/**
 * Hook that sets up measure bindings for a node
 * Updates shared values with layout measurements (width, height, x, y)
 */
export function useMeasureBindings(node: NodeState, map: SVMap) {
  const animatedRef = useAnimatedRef<any>();

  console.log(
    "useMeasureBindings hook called for node:",
    node.id,
    "bindings:",
    node.measureBindings
  );

  // Set up frame callback to continuously measure and update shared values
  const frameCallback = useFrameCallback(() => {
    "worklet";
    if (!node.measureBindings || node.measureBindings.length === 0) {
      return;
    }
    try {
      const measurement = measure(animatedRef);
      if (measurement && node.measureBindings) {
        for (const binding of node.measureBindings) {
          const sharedValue = map[binding.targetSharedValueId];
          if (sharedValue) {
            const value = measurement[binding.property];
            if (value !== undefined && sharedValue.value !== value) {
              sharedValue.value = value;
            }
          }
        }
      }
    } catch {
      // Measurement not ready yet
    }
  });

  useEffect(() => {
    if (!node.measureBindings || node.measureBindings.length === 0) {
      return;
    }

    // Start the frame callback
    runOnUI(() => {
      frameCallback.setActive(true);
    })();

    // Cleanup
    return () => {
      runOnUI(() => {
        frameCallback.setActive(false);
      })();
    };
  }, [frameCallback, node.measureBindings]);

  return animatedRef;
}
