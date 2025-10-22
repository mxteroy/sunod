// components/Button.tsx
import { Selectable, SelectableState, TapEvent } from "@/core/Selectable";
import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../ThemedText";

// Apple hover-in easing (easeOut)
const appleHoverInEasing = Easing.bezier(0.25, 0.46, 0.45, 0.94);

// Apple hover-out easing (easeIn)
const appleHoverOutEasing = Easing.bezier(0.55, 0.08, 0.68, 0.53);

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

  // Press animation (scale + shadow fade)
  const progress = useSharedValue(0);
  const hoverProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 0.8]);

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

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
