import React, { useCallback } from "react";
import { StyleProp, ViewProps, ViewStyle } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  LongPressGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { HoverGestureHandlerEventPayload } from "react-native-gesture-handler/lib/typescript/handlers/GestureHandlerEventPayload";
import Animated, { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export type TapEvent = GestureStateChangeEvent<TapGestureHandlerEventPayload>;
export type LongPressEvent =
  GestureStateChangeEvent<LongPressGestureHandlerEventPayload>;
export type HoverEvent =
  GestureStateChangeEvent<HoverGestureHandlerEventPayload>;

export enum SelectableState {
  DEFAULT,
  HOVERED,
  PRESSED,
}

export interface SelectableProps extends ViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Whether the selectable is disabled.
   */
  disabled?: boolean;
  /**
   * Handler called when a press is initiated. Runs on the JS thread.
   */
  onPressIn?: (event: TapEvent) => void;
  /**
   * Worklet called when a press is initiated. Runs on the UI thread.
   */
  onPressIn_UI?: (event: TapEvent) => void;
  /**
   * Handler called when a press is released. Runs on the JS thread.
   */
  onPressOut?: (event: TapEvent, success: boolean) => void;
  /**
   * Worklet called when a press is released. Runs on the UI thread.
   */
  onPressOut_UI?: (event: TapEvent, success: boolean) => void;
  /**
   * Handler called when a tap is successfully recognized. Runs on the JS thread.
   */
  onPress?: (event: TapEvent) => void;
  /**
   * Worklet called when a tap is successfully recognized. Runs on the UI thread.
   */
  onPress_UI?: (event: TapEvent) => void;
  /**
   * Handler called when a hover is initiated. Runs on the JS thread.
   */
  onHoverIn?: (event: HoverEvent) => void;
  /**
   * Worklet called when a hover is initiated. Runs on the UI thread.
   */
  onHoverIn_UI?: (event: HoverEvent) => void;
  /**
   * Handler called when a hover is finished. Runs on the JS thread.
   */
  onHoverOut?: (event: HoverEvent) => void;
  /**
   * Worklet called when a hover is finished. Runs on the UI thread.
   */
  onHoverOut_UI?: (event: HoverEvent) => void;
  /**
   * Handler called when the selectable state changes. Runs on the JS thread.
   */
  onSelectableStateChange?: (state: SelectableState) => void;
  /**
   * Worklet called when the selectable state changes. Runs on the UI thread.
   */
  onSelectableStateChange_UI?: (state: SelectableState) => void;
}

/**
 * A custom Selectable component built with Reanimated and Gesture Handler.
 * It manages hover and press states and provides both JS thread and UI thread (worklet) event handlers.
 */
export const Selectable: React.FC<SelectableProps> = ({
  children,
  style,
  disabled,
  onPress,
  onPress_UI,
  onPressIn,
  onPressIn_UI,
  onPressOut,
  onPressOut_UI,
  onHoverIn,
  onHoverIn_UI,
  onHoverOut,
  onHoverOut_UI,
  onSelectableStateChange,
  onSelectableStateChange_UI,
  ...rest
}) => {
  const selectableState = useSharedValue(SelectableState.DEFAULT);
  const isHovered = useSharedValue(false);
  const isPressed = useSharedValue(false);

  const updateState = useCallback(
    (newIsPressed: boolean | null, newIsHovered: boolean | null) => {
      "worklet";

      if (newIsPressed !== null) {
        isPressed.value = newIsPressed;
      }
      if (newIsHovered !== null) {
        isHovered.value = newIsHovered;
      }

      const oldState = selectableState.value;
      const newState = isPressed.value
        ? SelectableState.PRESSED
        : isHovered.value
          ? SelectableState.HOVERED
          : SelectableState.DEFAULT;

      if (oldState === newState) {
        return;
      }

      selectableState.value = newState;

      onSelectableStateChange_UI?.(newState);
      if (onSelectableStateChange) {
        scheduleOnRN(() => {
          onSelectableStateChange(newState);
        });
      }
    },
    [
      isHovered,
      isPressed,
      onSelectableStateChange,
      onSelectableStateChange_UI,
      selectableState,
    ]
  );

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin((event) => {
      "worklet";
      updateState(true, null);
      onPressIn_UI?.(event);
      if (onPressIn) {
        scheduleOnRN(onPressIn, event);
      }
    })
    .onFinalize((event, success) => {
      "worklet";
      updateState(false, null);
      onPressOut_UI?.(event, success);
      if (onPressOut) {
        scheduleOnRN(onPressOut, event, success);
      }
      if (success) {
        if (onPress_UI) {
          onPress_UI(event);
        }
        if (onPress) {
          scheduleOnRN(onPress, event);
        }
      }
    });

  const hoverGesture = Gesture.Hover()
    .enabled(!disabled)
    .onBegin((event) => {
      "worklet";
      updateState(null, true);
      onHoverIn_UI?.(event);
      if (onHoverIn) {
        scheduleOnRN(onHoverIn, event);
      }
    })
    .onEnd((event) => {
      "worklet";
      updateState(null, false);
      onHoverOut_UI?.(event);
      if (onHoverOut) {
        scheduleOnRN(onHoverOut, event);
      }
    });

  const composedGesture = Gesture.Simultaneous(hoverGesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={style} {...rest}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};
