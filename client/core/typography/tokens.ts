// src/design/tokens.ts
export const colors = {
  // Neutrals (brand)
  black: "#12100C",
  gray100: "#EDEBE5",
  gray300: "#B6B5B1",
  gray500: "#9E9D99",
  paper: "#F3EFE7",

  // Accents
  red: "#F4264A", // brand red
  green: "#00A95C", // brand green

  // Derived
  textHigh: "#12100C",
  textMid: "rgba(18,16,12,0.7)",
  textLow: "rgba(18,16,12,0.5)",
  border: "rgba(18,16,12,0.12)",
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const typography = {
  families: {
    display: "CormorantGaramond_700Bold",
    displayAlt: "CormorantGaramond_600SemiBold",
    sans: "Inter_400Regular",
    sansMed: "Inter_500Medium",
    sansSemi: "Inter_600SemiBold",
    mono: "SpaceMono_700Bold",
    monoRegular: "SpaceMono_400Regular",
  },
  // Using a modular-ish scale tuned to your specimen
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 22,
    xl: 28,
    "2xl": 34,
    "3xl": 44,
    "4xl": 56,
    "5xl": 72,
  },
  lineHeights: {
    tight: 1.05,
    snug: 1.15,
    normal: 1.3,
    relaxed: 1.45,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    caps: 2.5,
  },
};

export const shadows = {
  sm: {
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  md: {
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  lg: {
    elevation: 8,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
};

export const opacities = { disabled: 0.5, pressed: 0.7, focus: 0.9 };
