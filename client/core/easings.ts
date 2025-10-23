// Shared animation easings
import { Easing } from "react-native-reanimated";

// Apple hover-in easing (easeOut) - smooth acceleration
export const appleHoverInEasing = Easing.bezier(0.25, 0.46, 0.45, 0.94);

// Apple hover-out easing (easeIn) - smooth deceleration
export const appleHoverOutEasing = Easing.bezier(0.55, 0.08, 0.68, 0.53);

// Apple smooth easing (easeInOut) - balanced
export const appleSmoothEasing = Easing.bezier(0.4, 0.0, 0.2, 1.0);
