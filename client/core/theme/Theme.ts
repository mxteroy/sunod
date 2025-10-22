export interface ColorPalette {
  /** * The main brand color, used for primary actions (like buttons), headers,
   * and important highlights that define the core identity of the app.
   */
  primary: string;

  /** * A supporting color that complements the primary color. Used for less
   * prominent components and elements that don't require as much emphasis.
   */
  secondary: string;

  /** * A vibrant, eye-catching color used for calls-to-action (CTAs), floating
   * action buttons, and other elements that need to stand out and grab the user's attention.
   */
  accent: string;

  /** * The base color for the screen or view background. This is the bottom-most
   * layer that other UI elements sit on top of.
   */
  background: string;

  /** * The primary color for all readable body copy, titles, and labels to ensure
   * high contrast and legibility against the background or surface.
   */
  text: string;

  /** * The background color for elevated elements that sit on top of the main
   * background, such as cards, modals, menus, and input fields.
   */
  surface: string;

  /** * The default color for symbolic icons to ensure they are clear, consistent,
   * and have good contrast against their container's background.
   */
  icon: string;

  /** * Color for placeholder text in input fields. */
  placeholder: string;

  /** * Background color for chat bubbles and message containers. */
  bubble: string;

  /** * The color for primary interactive elements when hovered. */
  primaryHover: string;

  /** * The color for secondary interactive elements when hovered. */
  secondaryHover: string;

  /** * The color for accent interactive elements when hovered. */
  accentHover: string;

  /** * The color for surface elements when hovered. */
  surfaceHover: string;
}

interface ThemeModes {
  light: ColorPalette;
  dark: ColorPalette;
}

export interface Theme {
  monochromatic: ThemeModes;
  analogous: ThemeModes;
  triadic: ThemeModes;
}

const baseColors = {
  // Base Colors
  blue: "#3498db",
  green: "#2ecc71",
  red: "#e74c3c",
  yellow: "#f1c40f",

  // Neutral Shades
  white: "#ffffff",
  lightGray: "#f2f2f2",
  gray: "#bdc3c7",
  mediumGray: "#808b96",
  darkGray: "#2c3e50",
  black: "#1a1a1a",
};
export const theme: Theme = {
  monochromatic: {
    light: {
      primary: baseColors.blue,
      secondary: "#85c1e9", // Lighter shade of blue
      accent: "#2874a6", // Darker shade of blue
      background: baseColors.lightGray,
      surface: baseColors.white,
      text: baseColors.black,
      icon: baseColors.mediumGray,
      placeholder: baseColors.gray,
      bubble: "#e9ecef", // A subtle, off-white gray
      primaryHover: "#2980b9", // Darker blue
      secondaryHover: "#a9cce3", // Lighter blue
      accentHover: "#1f618d", // Darker blue
      surfaceHover: "#e8e8e8", // Slightly darker white
    },
    dark: {
      primary: baseColors.blue,
      secondary: "#2874a6", // Darker shade of blue
      accent: "#85c1e9", // Lighter shade of blue
      background: baseColors.black,
      surface: baseColors.darkGray,
      text: baseColors.white,
      icon: baseColors.gray,
      placeholder: baseColors.mediumGray,
      bubble: "#212730", // A darker gray, less saturated than surface
      primaryHover: "#5dade2", // Lighter blue
      secondaryHover: "#1f618d", // Darker blue
      accentHover: "#a9cce3", // Lighter blue
      surfaceHover: "#34495e", // Lighter dark gray
    },
  },
  analogous: {
    light: {
      primary: baseColors.blue,
      secondary: baseColors.green,
      accent: "#2980b9", // A slightly different shade of blue
      background: baseColors.lightGray,
      surface: baseColors.white,
      text: baseColors.black,
      icon: baseColors.mediumGray,
      placeholder: baseColors.gray,
      bubble: "#e9ecef", // A subtle, off-white gray
      primaryHover: "#2980b9", // Darker blue
      secondaryHover: "#58d68d", // Lighter green
      accentHover: "#1f618d", // Darker blue
      surfaceHover: "#e8e8e8", // Slightly darker white
    },
    dark: {
      primary: baseColors.blue,
      secondary: baseColors.green,
      accent: "#82e0aa", // Lighter shade of green
      background: baseColors.black,
      surface: baseColors.darkGray,
      text: baseColors.white,
      icon: baseColors.gray,
      placeholder: baseColors.mediumGray,
      bubble: "#212730", // A darker gray, less saturated than surface
      primaryHover: "#5dade2", // Lighter blue
      secondaryHover: "#27ae60", // Darker green
      accentHover: "#abebc6", // Lighter green
      surfaceHover: "#34495e", // Lighter dark gray
    },
  },
  triadic: {
    light: {
      primary: baseColors.blue,
      secondary: baseColors.red,
      accent: baseColors.yellow,
      background: baseColors.lightGray,
      surface: baseColors.white,
      text: baseColors.black,
      icon: baseColors.mediumGray,
      placeholder: baseColors.gray,
      bubble: "#e9ecef", // A subtle, off-white gray
      primaryHover: "#2980b9", // Darker blue
      secondaryHover: "#ec7063", // Lighter red
      accentHover: "#f39c12", // Darker yellow
      surfaceHover: "#e8e8e8", // Slightly darker white
    },
    dark: {
      primary: baseColors.blue,
      secondary: baseColors.red,
      accent: "#f7dc6f", // Lighter shade of yellow
      background: baseColors.black,
      surface: baseColors.darkGray,
      text: baseColors.white,
      icon: baseColors.gray,
      placeholder: baseColors.mediumGray,
      bubble: "#212730", // A darker gray, less saturated than surface
      primaryHover: "#5dade2", // Lighter blue
      secondaryHover: "#c0392b", // Darker red
      accentHover: "#f9e79f", // Lighter yellow
      surfaceHover: "#34495e", // Lighter dark gray
    },
  },
};
