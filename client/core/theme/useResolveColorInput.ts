import { useTheme } from "@/core/theme/ThemeContext";
import type {
  ColorInput,
  ColorOverride,
  ColorRef,
  ThemeColorName,
} from "@shared/schema";
import { useColorScheme } from "react-native";

const isColorRef = (v: any): v is ColorRef =>
  !!v && typeof v === "object" && v.type === "theme" && !!v.name;

const isColorOverride = (v: any): v is ColorOverride =>
  !!v && typeof v === "object" && ("light" in v || "dark" in v);

/**
 * Low-level resolver that converts any ColorInput → concrete hex/rgb string.
 * - Theme tokens resolved via ThemeContext colors
 * - Overrides ({light?, dark?}) respect current OS color scheme
 * - Raw strings are returned as-is
 */
export function useResolveColorInput(input?: ColorInput): string | undefined {
  const { colors } = useTheme(); // already mode+theme-picked palette
  const scheme = useColorScheme() ?? "light";

  if (!input) return undefined;

  if (typeof input === "string") return input;

  if (isColorRef(input)) {
    const token = input.name as ThemeColorName;
    // @ts-ignore - token keys match ColorPalette
    return colors[token];
  }

  if (isColorOverride(input)) {
    // Prefer exact scheme if provided, else fall back to the other one
    return scheme === "dark"
      ? (input.dark ?? input.light)
      : (input.light ?? input.dark);
  }

  return undefined;
}
