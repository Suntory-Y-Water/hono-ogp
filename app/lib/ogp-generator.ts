/**
 * Satoriを使用してOGP画像を生成するライブラリ
 * Cloudflare Workers環境でのパフォーマンス最適化を重視
 */

import satori from 'satori';
import { initialize, svg2png } from 'svg2png-wasm';
import { OgpParams } from './cloudflare';

/**
 * 画像生成パラメータ
 */
export interface ImageGenerationParams {
  title: string;
  gradient: string;
  width?: number;
  height?: number;
}

/**
 * サポートするグラデーション定義
 */
export const GRADIENT_PRESETS = {
  'blue-to-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'pink-to-orange': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'green-to-blue': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'ocean': 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
} as const;

export type GradientType = keyof typeof GRADIENT_PRESETS;

/**
 * Satori用の軽量日本語フォント設定
 * Cloudflare Workers制限内で動作するよう最小限のフォントを使用
 */
let cachedFont: ArrayBuffer | null = null;

/**
 * フォントデータを取得（キャッシュ付き）
 */
async function getFontData(): Promise<ArrayBuffer> {
  if (cachedFont) {
    return cachedFont;
  }

  // Noto Sans JPの軽量版を使用（Production環境では適切なフォントURLに変更）
  const fontUrl = 'https://fonts.gstatic.com/s/notosansjp/v52/nwpMtK6mNhBK2err_hqkYhHRqmwaYOjZ8A.woff2';
  
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`フォント取得エラー: ${response.status}`);
    }
    
    cachedFont = await response.arrayBuffer();
    return cachedFont;
  } catch (error) {
    // フォールバック: システムフォントを使用
    console.warn('フォント取得に失敗、システムフォントを使用:', error);
    return new ArrayBuffer(0);
  }
}

// テンプレート生成は ogp-template.tsx から import
import { createSimpleOgpTemplate } from './ogp-template';

/**
 * SatoriでSVGを生成
 */
async function generateSvg(params: ImageGenerationParams): Promise<string> {
  const template = createSimpleOgpTemplate({
    title: params.title,
    gradient: params.gradient as GradientType,
    width: params.width,
    height: params.height,
  });
  const fontData = await getFontData();
  
  const svg = await satori(template, {
    width: params.width || 1200,
    height: params.height || 630,
    fonts: fontData.byteLength > 0 ? [
      {
        name: 'Noto Sans JP',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
    ] : [],
  });

  return svg;
}

/**
 * WASM初期化フラグ
 */
let wasmInitialized = false;

/**
 * WASMを初期化（一度だけ実行）
 */
async function initializeWasm(): Promise<void> {
  if (wasmInitialized) {
    return;
  }
  
  try {
    const wasmUrl = 'https://unpkg.com/svg2png-wasm@1.4.1/svg2png_wasm_bg.wasm';
    await initialize(fetch(wasmUrl));
    wasmInitialized = true;
  } catch (error) {
    throw new Error(`WASM初期化エラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * SVGをPNGに変換
 */
async function convertSvgToPng(params: {
  svg: string;
  width?: number;
  height?: number;
}): Promise<ArrayBuffer> {
  await initializeWasm();
  
  const pngBuffer = await svg2png(params.svg, {
    width: params.width || 1200,
    height: params.height || 630,
  });

  // Uint8ArrayからArrayBufferに変換
  if (pngBuffer.buffer instanceof ArrayBuffer) {
    return pngBuffer.buffer.slice(0);
  }
  
  // Uint8Arrayから新しいArrayBufferを作成
  const arrayBuffer = new ArrayBuffer(pngBuffer.length);
  const uint8View = new Uint8Array(arrayBuffer);
  uint8View.set(pngBuffer);
  
  return arrayBuffer;
}

/**
 * OGP画像を生成（メイン関数）
 */
export async function generateOgpImage(params: ImageGenerationParams): Promise<ArrayBuffer> {
  try {
    // SVG生成
    const svg = await generateSvg(params);
    
    // PNG変換
    const pngBuffer = await convertSvgToPng({
      svg,
      width: params.width,
      height: params.height,
    });

    return pngBuffer;
  } catch (error) {
    throw new Error(`OGP画像生成エラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * OGPパラメータから画像生成パラメータに変換
 */
export function ogpParamsToImageParams(ogpParams: OgpParams): ImageGenerationParams {
  return {
    title: ogpParams.title,
    gradient: ogpParams.gradient,
    width: 1200,
    height: 630,
  };
}

/**
 * グラデーションタイプの検証
 */
export function isValidGradient(gradient: string): gradient is GradientType {
  return gradient in GRADIENT_PRESETS;
}

/**
 * 軽量画像生成（Cloudflare Free版対応）
 * CPU時間制限内で動作するよう最適化
 */
export async function generateLightweightOgpImage(params: ImageGenerationParams): Promise<ArrayBuffer> {
  // 画像サイズを制限してパフォーマンスを向上
  const optimizedParams: ImageGenerationParams = {
    ...params,
    width: Math.min(params.width || 1200, 1200),
    height: Math.min(params.height || 630, 630),
  };

  // タイトルを制限して処理時間を短縮
  if (optimizedParams.title.length > 100) {
    optimizedParams.title = optimizedParams.title.substring(0, 97) + '...';
  }

  return await generateOgpImage(optimizedParams);
}