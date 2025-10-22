# Text and Button Components with Glass Effects

This implementation adds support for Text and Button components to the Sunod schema renderer, with glass effect styling using React Native Skia.

## Features Added

### 1. Schema Extensions (`shared/schema.z.ts`)

#### Text Component

```typescript
export const zText = z.object({
  type: z.literal("Text"),
  id: z.string(),
  text: z.string(),
  style: zStyle.optional(),
});
```

#### Button Component

```typescript
export const zButton = z.object({
  type: z.literal("Button"),
  id: z.string(),
  text: z.string(),
  onPress: z.string().optional(), // Action ID for handling press events
  style: zStyle.optional(),
  glassEffect: z.boolean().optional().default(false),
});
```

### 2. Renderer Implementation (`client/core/Renderer.tsx`)

#### Text Renderer

- Supports all style properties from the schema
- Uses `Animated.createAnimatedComponent(Text)` for smooth animations
- Binds to shared values for dynamic styling

#### Button Renderer with Glass Effects

- Interactive touch handling with `TouchableOpacity`
- Optional glass effect using React Native Skia
- Glass effect features:
  - Semi-transparent background with blur
  - Subtle border highlight
  - Backdrop blur filter for glassmorphism
- Press handling with customizable action IDs

#### Glass Effect Implementation

```typescript
function GlassBackground({ width, height, borderRadius }) {
  return (
    <Canvas style={{ position: 'absolute', width, height }}>
      <RoundedRect
        x={0} y={0}
        width={width} height={height}
        r={borderRadius}
        color="rgba(255, 255, 255, 0.15)"
      />
      <RoundedRect
        x={1} y={1}
        width={width - 2} height={height - 2}
        r={borderRadius - 1}
        style="stroke"
        strokeWidth={1}
        color="rgba(255, 255, 255, 0.2)"
      />
      <BackdropFilter filter={<Blur blur={10} />}>
        <RoundedRect
          x={0} y={0}
          width={width} height={height}
          r={borderRadius}
          color="rgba(255, 255, 255, 0.1)"
        />
      </BackdropFilter>
    </Canvas>
  );
}
```

### 3. Enhanced Sample Document (`client/core/sampleDoc.ts`)

Added examples showcasing:

- **Main Title**: Text component with animated opacity based on progress
- **Toggle Button**: Glass button that scales when pressed
- **Status Text**: Dynamic text that changes opacity based on state

Example text component:

```typescript
{
  type: "Text",
  id: "main-title",
  text: "🌟 Interactive Space Demo",
  style: {
    margin: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 12,
    borderRadius: 8,
    opacity: {
      bind: {
        type: "expr",
        op: "lerp",
        args: [0.6, 1, { type: "shared", ref: "progress" }],
      },
    },
  },
}
```

Example glass button:

```typescript
{
  type: "Button",
  id: "toggle-button",
  text: "Toggle Size",
  glassEffect: true,
  onPress: "toggle-big",
  style: {
    width: 160,
    height: 50,
    borderRadius: 16,
    margin: 16,
    backgroundColor: "rgba(34, 211, 238, 0.2)",
    transform: {
      scale: {
        bind: {
          type: "cond",
          if: {
            left: { type: "shared", ref: "buttonPressed" },
            op: ">",
            right: 0.5,
          },
          then: 0.95,
          else: 1,
        },
      },
    },
  },
}
```

## Dependencies Added

- `@shopify/react-native-skia@2.3.5` - For glass effects and advanced rendering

## Usage

### Text Component

```typescript
{
  type: "Text",
  id: "my-text",
  text: "Hello World",
  style: {
    // Any style properties supported by the schema
    opacity: { bind: { type: "shared", ref: "textOpacity" } },
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 12,
    borderRadius: 8,
  },
}
```

### Button Component

```typescript
{
  type: "Button",
  id: "my-button",
  text: "Click Me",
  glassEffect: true, // Enable glass effect
  onPress: "my-action", // Action ID for press handling
  style: {
    width: 120,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: {
      scale: { bind: { type: "shared", ref: "buttonScale" } },
    },
  },
}
```

## Architecture

The implementation follows the existing pattern:

1. **Schema Definition**: Zod schemas define the component structure
2. **Type Generation**: TypeScript types are inferred from schemas
3. **Renderer Components**: React components that interpret the schema
4. **Worklet Evaluation**: Style bindings evaluated on the UI thread
5. **Animation Support**: Full integration with React Native Reanimated

## Glass Effect Details

The glass effect implementation uses React Native Skia to create:

- **Base Layer**: Semi-transparent colored background
- **Border Layer**: Subtle stroke for definition
- **Blur Layer**: Backdrop filter with gaussian blur
- **Highlight Layer**: Additional semi-transparent overlay

This creates a modern glassmorphism effect that's popular in contemporary UI design.

## Integration

Both components integrate seamlessly with the existing:

- Shared value system for dynamic properties
- Expression and conditional evaluation
- Transform animations
- Style binding system
- Gesture handling (for buttons)

The components can be mixed with existing View components in any configuration and support all the dynamic styling capabilities of the schema system.
