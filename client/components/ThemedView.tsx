import { forwardRef } from "react";
import { StyleProp, View, ViewStyle, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  aStyle?: StyleProp<ViewStyle>;
  noTheme?: boolean;
};

export const ThemedView = forwardRef<View, ThemedViewProps>(
  (
    { style, aStyle, lightColor, darkColor, noTheme = false, ...otherProps },
    ref
  ) => {
    const backgroundColor = useThemeColor(
      { light: lightColor, dark: darkColor },
      "background"
    );
    if (aStyle) {
      return (
        <Animated.View
          ref={ref}
          style={[!noTheme && { backgroundColor }, style, aStyle]}
          {...otherProps}
        />
      );
    }
    return (
      <View
        ref={ref}
        style={[!noTheme && { backgroundColor }, style, aStyle]}
        {...otherProps}
      />
    );
  }
);

ThemedView.displayName = "ThemedView";
