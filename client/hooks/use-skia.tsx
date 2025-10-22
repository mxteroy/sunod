import React, { useState, useEffect } from 'react';

/**
 * Hook to check if React Native Skia is available and ready
 * Useful for conditional rendering of Skia components
 */
export function useSkiaAvailable(): boolean {
  const [isSkiaAvailable, setIsSkiaAvailable] = useState(false);

  useEffect(() => {
    const checkSkia = async () => {
      try {
        // Try to import Skia to see if it's available
        const { Skia } = await import('@shopify/react-native-skia');
        // Check if Skia is actually loaded (important for web)
        if (Skia && typeof Skia.Surface !== 'undefined') {
          setIsSkiaAvailable(true);
        }
      } catch (error) {
        console.warn('Skia not available:', error);
        setIsSkiaAvailable(false);
      }
    };

    checkSkia();
  }, []);

  return isSkiaAvailable;
}

/**
 * Component wrapper that only renders children when Skia is available
 * Provides a fallback component when Skia is not ready
 */
interface WithSkiaProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WithSkia({ children, fallback = null }: WithSkiaProps) {
  const isSkiaAvailable = useSkiaAvailable();
  
  return isSkiaAvailable ? <>{children}</> : <>{fallback}</>;
}