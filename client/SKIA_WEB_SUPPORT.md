# React Native Skia Web Support Implementation

This document outlines the implementation of React Native Skia web support for the Sunod project, enabling glass effect buttons and advanced graphics on web platforms.

## Setup Overview

### 1. Package Configuration

Updated `package.json` to use custom entry points:

```json
{
  "main": "index"
}
```

### 2. Entry Point Files

#### `index.tsx` (Native platforms)

```tsx
import "expo-router/entry";
```

#### `index.web.tsx` (Web platform)

```tsx
import "@expo/metro-runtime";
import { App } from "expo-router/build/qualified-entry";
import { renderRootComponent } from "expo-router/build/renderRootComponent";
import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

LoadSkiaWeb()
  .then(async () => {
    renderRootComponent(App);
  })
  .catch((error) => {
    console.error("Failed to load Skia:", error);
    renderRootComponent(App);
  });
```

### 3. Metro Configuration

Updated `metro.config.js` to support WASM files:

```javascript
config.resolver.assetExts.push("wasm");
```

### 4. Glass Effect Implementation

The `GlassBackground` component includes:

#### Skia Canvas Implementation

- Uses React Native Skia's Canvas, RoundedRect, and BackdropFilter
- Implements true gaussian blur effects
- Includes WebGL context management for web performance
- `__destroyWebGLContextAfterRender={true}` to prevent context limit issues

#### CSS Fallback for Web

- Falls back to CSS `backdrop-filter` when Skia fails
- Maintains visual consistency across platforms
- Graceful degradation for unsupported browsers

```tsx
// CSS backdrop-filter for web fallback
...(typeof window !== 'undefined' && {
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
})
```

### 5. Utility Hooks

#### `useSkiaAvailable()` Hook

- Detects Skia availability at runtime
- Useful for conditional rendering of Skia components
- Handles async loading states

#### `WithSkia` Component

- Wrapper component for conditional Skia rendering
- Provides fallback UI when Skia isn't available
- Clean API for progressive enhancement

## Web-Specific Optimizations

### WebGL Context Management

- Destroys WebGL contexts after rendering static content
- Prevents the "Too many active WebGL contexts" warning
- Maintains performance on web browsers

### Performance Considerations

- CanvasKit WASM file is ~2.9MB gzipped
- Loaded asynchronously to not block initial render
- Error boundaries prevent crashes when Skia fails

### Browser Compatibility

- Modern browsers with WebGL support get full Skia rendering
- Older browsers fall back to CSS effects
- Progressive enhancement approach

## Usage Examples

### Basic Glass Button

```typescript
{
  type: "Button",
  id: "glass-button",
  text: "Glass Effect",
  glassEffect: true,
  style: {
    width: 160,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
}
```

### Conditional Skia Rendering

```tsx
import { WithSkia } from "@/hooks/use-skia";

<WithSkia fallback={<RegularButton />}>
  <SkiaButton />
</WithSkia>;
```

## Architecture Benefits

### Cross-Platform Consistency

- Same glass effect code works on iOS, Android, and Web
- Unified styling system across all platforms
- Consistent animation behavior

### Performance Optimization

- Skia rendering on native platforms for best performance
- CSS fallbacks on web for compatibility
- WebGL context management prevents memory issues

### Developer Experience

- No platform-specific code in components
- Automatic fallbacks handled at framework level
- Easy to add more Skia effects in the future

## Testing

### Web Testing

1. Run `npx expo start --web`
2. Open http://localhost:8082
3. Verify glass buttons render with blur effects
4. Test fallback behavior in browsers without WebGL

### Native Testing

1. Run on iOS simulator: `npx expo run:ios`
2. Run on Android emulator: `npx expo run:android`
3. Verify Skia Canvas renders properly on both platforms

## Troubleshooting

### Common Issues

#### "CanvasKit is not defined"

- Ensure `yarn setup-skia-web` was run
- Check that canvaskit.wasm is in `/web/static/js/`
- Verify index.web.tsx is loading Skia before app

#### WebGL Context Limit

- Use `__destroyWebGLContextAfterRender={true}` on static canvases
- Limit number of simultaneous Canvas components
- Consider CSS fallbacks for simple effects

#### Build Errors on Web

- Ensure metro.config.js includes WASM asset extension
- Check that all Skia imports are properly conditional
- Verify entry point configuration in package.json

### Performance Tips

1. Use `__destroyWebGLContextAfterRender={true}` for static content
2. Implement CSS fallbacks for simple effects
3. Use the `WithSkia` wrapper for conditional rendering
4. Monitor WebGL context usage in browser dev tools

## Future Enhancements

- Add more Skia-based effects (gradients, shadows, animations)
- Implement Skia-based text rendering with custom fonts
- Add performance monitoring for WebGL usage
- Consider server-side rendering compatibility
