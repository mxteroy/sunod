// CanvasKit WASM loader utility
import { version } from "canvaskit-wasm/package.json";

export const createCanvasKitConfig = () => ({
  locateFile: (file: string) => {
    console.log(`Loading CanvasKit WASM file: ${file}`);
    
    // Multiple fallback CDNs for better reliability
    const cdnOptions = [
      `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/${file}`,
      `https://unpkg.com/canvaskit-wasm@${version}/bin/full/${file}`,
      `https://cdn.skypack.dev/canvaskit-wasm@${version}/bin/full/${file}`,
    ];
    
    return cdnOptions[0];
  },
});

export const preloadCanvasKit = async (): Promise<boolean> => {
  try {
    // Pre-check if the WASM files are accessible
    const testUrl = `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/canvaskit.wasm`;
    const response = await fetch(testUrl, { method: 'HEAD' });
    
    if (!response.ok) {
      console.warn(`CanvasKit WASM not accessible at ${testUrl}, status: ${response.status}`);
      return false;
    }
    
    console.log("CanvasKit WASM files are accessible");
    return true;
  } catch (error) {
    console.error("Failed to preload CanvasKit:", error);
    return false;
  }
};