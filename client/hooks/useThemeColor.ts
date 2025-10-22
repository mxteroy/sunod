// useThemeColor.ts
import { ColorPalette } from "@/core/theme/Theme";
import { useTheme } from "@/core/theme/ThemeContext";
import { useColorScheme } from "react-native"; // Or your preferred color scheme hook

/**
 * A hook to get a specific color from the theme.
 * It allows for overriding the theme color with a prop.
 *
 * @param props - An object that can contain light and dark color strings to override the theme.
 * @param colorName - The name of the color to retrieve from the theme palette.
 * @returns The resolved color string.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ColorPalette
) {
  // 1. Get the current active color mode ('light' or 'dark')
  const themeMode = useColorScheme() ?? "light";

  // 2. Get the currently active color palette from our context
  const { colors: themeColors } = useTheme();

  // 3. Check if a color was passed directly in props for the current mode
  const colorFromProps = props[themeMode];

  // 4. If a prop color exists, return it
  if (colorFromProps) {
    return colorFromProps;
  } else {
    // 5. Otherwise, return the color from the active theme palette
    return themeColors[colorName];
  }
}
