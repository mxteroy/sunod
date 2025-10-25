// components/Button.tsx
import { Selectable, SelectableState, TapEvent } from "@/core/Selectable";
import { appleHoverInEasing, appleHoverOutEasing } from "@/core/easings";
import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  interpolate,
  interpolateColor,
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../ThemedText";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress?: (e: TapEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  aStyle: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Optional icon renderers */
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Optional color overrides */
  colors?: { light?: string; dark?: string }; // overrides background (non-ghost)
  textColors?: { light?: string; dark?: string }; // overrides label color
}

export const Button: React.FC<ButtonProps> = ({
  title,
  aStyle,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  style,
  leftIcon,
  rightIcon,
  colors,
  textColors,
}) => {
  // --- Color Logic ---
  const bg = useThemeColor(
    colors || {},
    variant === "primary"
      ? "primary"
      : variant === "secondary"
        ? "secondary"
        : "accent"
  );

  const hoverBg = useThemeColor(
    {},
    variant === "primary"
      ? "primaryHover"
      : variant === "secondary"
        ? "secondaryHover"
        : "accentHover"
  );

  const ghostHoverBg = useThemeColor({}, "surfaceHover");

  const labelColor = useThemeColor(
    textColors || {},
    variant === "ghost" ? "primary" : "text"
  );

  const surface = useThemeColor({}, "surface");
  const borderColor = variant === "ghost" ? surface : "transparent";
  // --- End Color Logic ---

  const sizes: Record<
    ButtonSize,
    { ph: number; pv: number; radius: number; gap: number; font: number }
  > = {
    sm: { ph: 12, pv: 8, radius: 12, gap: 6, font: 13 },
    md: { ph: 16, pv: 12, radius: 14, gap: 8, font: 15 },
    lg: { ph: 20, pv: 16, radius: 18, gap: 10, font: 17 },
  };

  const S = sizes[size];

  Gesture.Pan().onChange((e) => {});

  // Press animation (scale + shadow fade)
  const progress = useSharedValue(0);
  const hoverProgress = useSharedValue(0);
  const buttonWidth = useSharedValue(0);
  const animatedRef = useAnimatedRef<View>();

  const animatedStyle = useAnimatedStyle(() => {
    // Measure button width if not yet measured
    if (buttonWidth.value === 0) {
      try {
        const measurement = measure(animatedRef);
        if (measurement) {
          buttonWidth.value = measurement.width;
        }
      } catch (e) {
        // Measurement not ready yet
      }
    }

    // Calculate scale to reduce by constant 12px instead of percentage
    // scale = (width - 12) / width
    const targetScale =
      buttonWidth.value > 0
        ? Math.max(0.85, (buttonWidth.value - 12) / buttonWidth.value)
        : 0.96; // fallback if width not measured yet

    const scale = interpolate(progress.value, [0, 1], [1, targetScale]);

    const backgroundColor = interpolateColor(
      hoverProgress.value,
      [0, 1],
      [
        variant === "ghost" ? "transparent" : bg,
        variant === "ghost" ? ghostHoverBg : hoverBg,
      ]
    );

    return {
      transform: [{ scale }],
      backgroundColor,
    };
  });

  const onSelectableStateChange_UI = useCallback(
    (state: SelectableState) => {
      "worklet";
      switch (state) {
        case SelectableState.HOVERED:
          hoverProgress.value = withTiming(1, {
            duration: 200,
            easing: appleHoverInEasing,
          });
          break;
        default:
          hoverProgress.value = withTiming(0, {
            duration: 200,
            easing: appleHoverOutEasing,
          });
          break;
      }

      switch (state) {
        case SelectableState.PRESSED:
          progress.value = withTiming(1, {
            duration: 250,
            easing: appleHoverInEasing,
          });
          break;
        default:
          progress.value = withTiming(0, {
            duration: 200,
            easing: appleHoverOutEasing,
          });
          break;
      }
    },
    [progress, hoverProgress]
  );

  return (
    <Selectable
      ref={animatedRef}
      onPress={onPress}
      onSelectableStateChange_UI={onSelectableStateChange_UI}
      disabled={disabled || loading}
      style={[
        style,
        animatedStyle,
        aStyle,
        {
          paddingHorizontal: S.ph,
          paddingVertical: S.pv,
          borderRadius: S.radius,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: borderColor,
          elevation: variant === "ghost" ? 0 : 4,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {/* subtle inner highlight / gloss */}
      {variant !== "ghost" && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: S.radius,
            },
          ]}
        />
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: S.gap,
        }}
      >
        {leftIcon}
        {loading ? (
          <ActivityIndicator color={labelColor} />
        ) : (
          <ThemedText
            style={{
              color: labelColor,
              fontSize: S.font,
            }}
          >
            {title}
          </ThemedText>
        )}
        {rightIcon}
      </View>
    </Selectable>
  );
};
