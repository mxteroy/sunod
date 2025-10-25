import { createContext, useContext } from 'react';

/**
 * Audio context for passing appId through the render tree
 * This allows audio actions to namespace sounds/timers per app
 */
export const AudioAppContext = createContext<string>('default');

export function useAudioAppId() {
  return useContext(AudioAppContext);
}
