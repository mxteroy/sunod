// ThemeContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native"; // Or your preferred color scheme hook
import { ColorPalette, Theme, theme } from "./Theme";

// Define the shape of the context
interface ThemeContextType {
  themeName: keyof Theme;
  setThemeName: (name: keyof Theme) => void;
  colors: ColorPalette;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Create the provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<keyof Theme>("monochromatic"); // Default theme
  const colorScheme = useColorScheme() ?? "light"; // Default to light mode

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    const colors = theme[themeName][colorScheme];
    return {
      themeName,
      setThemeName,
      colors,
    };
  }, [themeName, colorScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Create a hook to easily use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
