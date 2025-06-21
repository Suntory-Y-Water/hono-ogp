/**
 * アプリケーション定数
 */

/**
 * Gradient presets
 */
export const GRADIENT_PRESETS = {
  sunset: { from: '#ff7e5f', to: '#feb47b' },
  ocean: { from: '#667eea', to: '#764ba2' },
  forest: { from: '#11998e', to: '#38ef7d' },
  purple: { from: '#8360c3', to: '#2ebf91' },
  fire: { from: '#ff416c', to: '#ff4b2b' },
} as const;

export type GradientPresetName = keyof typeof GRADIENT_PRESETS;
