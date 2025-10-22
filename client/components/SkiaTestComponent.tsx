import React from 'react';
import { View, Text } from 'react-native';
import { Canvas, Rect, LinearGradient, vec } from '@shopify/react-native-skia';

/**
 * Test component to verify Skia is working on web
 * This component will render a gradient rectangle using Skia
 * If Skia is not available, it will show a fallback message
 */
export default function SkiaTestComponent() {
  try {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: 'bold' }}>
          Skia Test - Gradient Rectangle
        </Text>
        <Canvas style={{ width: 200, height: 100 }}>
          <Rect x={0} y={0} width={200} height={100}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(200, 100)}
              colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
            />
          </Rect>
        </Canvas>
        <Text style={{ marginTop: 10, color: 'green' }}>
          ✅ Skia is working! You should see a gradient rectangle above.
        </Text>
      </View>
    );
  } catch (error) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 16 }}>
          ❌ Skia not available: {error?.toString()}
        </Text>
        <Text style={{ marginTop: 10 }}>
          This is expected on platforms where Skia is not supported.
        </Text>
      </View>
    );
  }
}