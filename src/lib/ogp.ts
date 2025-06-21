/**
 * OGP image generation library
 * Generates OGP images using Satori and svg2png-wasm
 */

import satori, { type SatoriOptions } from 'satori';
import { svg2png } from 'svg2png-wasm';
import { OGPTemplate } from '@/components/features/ogp-template';

export interface OGPImageOptions {
  title: string;
  gradient?: {
    from: string;
    to: string;
  };
  width?: number;
  height?: number;
}

/**
 * JSXテンプレートを使用してOGP画像を生成
 */
function createOGPTemplate(options: OGPImageOptions) {
  const { title, gradient } = options;

  return OGPTemplate({
    title,
    gradient: gradient || { from: '#667eea', to: '#764ba2' },
  });
}

/**
 * Convert SVG to PNG using svg2png-wasm
 */
async function convertSvgToPng(svg: string): Promise<Uint8Array> {
  try {
    const pngBuffer = await svg2png(svg);
    return pngBuffer;
  } catch (error) {
    console.error('SVG to PNG conversion failed:', error);
    throw new Error('SVG to PNG conversion failed');
  }
}

/**
 * Generate OGP image as SVG format
 */
export async function generateOGPImageSvg(
  options: OGPImageOptions,
): Promise<string> {
  const { width = 1200, height = 630 } = options;

  try {
    const template = createOGPTemplate(options);

    const satoriOptions: SatoriOptions = {
      width,
      height,
      fonts: [
        {
          name: 'Inter',
          data: await getDefaultFont(),
          weight: 400,
          style: 'normal',
        },
      ],
    };

    const svg = await satori(template, satoriOptions);
    return svg;
  } catch (error) {
    console.error('OGP SVG generation failed:', error);
    throw new Error('OGP SVG generation failed');
  }
}

/**
 * Generate OGP image as PNG format
 */
export async function generateOGPImagePng(
  options: OGPImageOptions,
): Promise<Uint8Array> {
  try {
    const svg = await generateOGPImageSvg(options);
    const pngBuffer = await convertSvgToPng(svg);
    return pngBuffer;
  } catch (error) {
    console.error('OGP PNG generation failed:', error);
    throw new Error('OGP PNG generation failed');
  }
}

/**
 * Get default font (temporary implementation)
 */
async function getDefaultFont(): Promise<ArrayBuffer> {
  const response = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
  );
  if (!response.ok) {
    throw new Error('Failed to load default font');
  }
  return await response.arrayBuffer();
}

/**
 * Validate OGP options
 */
export function validateOGPOptions(options: OGPImageOptions): boolean {
  if (!options.title || options.title.trim().length === 0) {
    return false;
  }

  if (options.width && (options.width < 400 || options.width > 2000)) {
    return false;
  }

  if (options.height && (options.height < 200 || options.height > 1000)) {
    return false;
  }

  return true;
}

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
