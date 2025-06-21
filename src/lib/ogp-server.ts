/**
 * OGP image generation library (Server-side only)
 * Generates OGP images using Satori and svg2png-wasm
 */

import satori, { type SatoriOptions } from 'satori';
import { svg2png, initialize } from 'svg2png-wasm';
import { OGPTemplate } from '@/components/features/ogp-template';
import fs from 'node:fs';
import path from 'node:path';

// WASM初期化フラグ
let wasmInitialized = false;

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
    // WASM初期化（初回のみ）
    if (!wasmInitialized) {
      // WASMファイルをfetchして初期化
      const wasmUrl =
        'https://unpkg.com/svg2png-wasm@1.4.1/svg2png_wasm_bg.wasm';
      const wasmResponse = await fetch(wasmUrl);
      const wasmBytes = await wasmResponse.arrayBuffer();
      await initialize(wasmBytes);
      wasmInitialized = true;
    }

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
          name: 'Noto Sans JP',
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
 * Get default font (NotoSansJP from local assets)
 */
async function getDefaultFont(): Promise<ArrayBuffer> {
  try {
    const fontPath = path.join(
      process.cwd(),
      'src/assets/fonts/NotoSansJP-Regular.ttf',
    );
    const fontBuffer = fs.readFileSync(fontPath);
    return fontBuffer.buffer.slice(
      fontBuffer.byteOffset,
      fontBuffer.byteOffset + fontBuffer.byteLength,
    );
  } catch (error) {
    console.error('Failed to load local font:', error);
    throw new Error('Failed to load local font');
  }
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
