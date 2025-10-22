// components/ThemedText.tsx
import { useTheme } from "@/core/theme/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor"; // adjust path if needed
import React from "react";
import {
  Text as RNText,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
} from "react-native";
import Animated from "react-native-reanimated";

type TextVariant = "display" | "h1" | "h2" | "title" | "body" | "label";

export interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  align?: "auto" | "left" | "right" | "center" | "justify";
  uppercase?: boolean;
  muted?: boolean;
  /** Optional color overrides per your hook contract */
  color?: { light?: string; dark?: string };
  /** Optional explicit fontFamily to override defaults */
  fontFamily?: string;
  aStyle?: StyleProp<TextStyle>[];
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = "body",
  align = "auto",
  uppercase,
  muted,
  color,
  fontFamily,
  style,
  children,
  aStyle,
  ...rest
}) => {
  const textColor = useThemeColor(color ?? {}, muted ? "icon" : "text");
  const { typography } = useTheme() as any; // if you expose typography in ThemeContext
  // Fallback font families if typography isn't provided
  const fallback = {
    display: {
      family: "CormorantGaramond_700Bold",
      size: 56,
      lh: 1.05,
      ls: -0.5,
    },
    h1: { family: "CormorantGaramond_600SemiBold", size: 44, lh: 1.08, ls: 0 },
    h2: { family: "CormorantGaramond_600SemiBold", size: 28, lh: 1.12, ls: 0 },
    title: { family: "Inter_600SemiBold", size: 22, lh: 1.25, ls: 0 },
    body: { family: "Inter_400Regular", size: 16, lh: 1.45, ls: 0 },
    label: { family: "SpaceMono_700Bold", size: 12, lh: 1.2, ls: 2 },
  } as const;

  const preset = typography?.[variant]
    ? {
        family: typography[variant].family,
        size: typography[variant].size,
        lh: typography[variant].lineHeight ?? 1.3,
        ls: typography[variant].letterSpacing ?? 0,
      }
    : fallback[variant];

  const Component = aStyle != null ? Animated.Text : RNText;

  return (
    <Component
      {...rest}
      style={[
        styles.base,
        {
          color: textColor,
          textAlign: align,
          textTransform: uppercase ? "uppercase" : "none",
          fontFamily: fontFamily ?? preset.family,
          fontSize: preset.size,
          lineHeight: preset.size * preset.lh,
          letterSpacing: preset.ls,
        },
        style,
        aStyle,
      ]}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
