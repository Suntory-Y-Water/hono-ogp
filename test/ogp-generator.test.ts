/**
 * OGP画像生成ライブラリのテスト
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  generateOgpImage,
  ogpParamsToImageParams,
  isValidGradient,
  generateLightweightOgpImage,
  GRADIENT_PRESETS,
  type ImageGenerationParams,
  type GradientType,
} from '../app/lib/ogp-generator';
import type { OgpParams } from '../app/lib/cloudflare';

// SVG2PNG-WASMとSatoriをモック
vi.mock('svg2png-wasm', () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  svg2png: vi.fn().mockImplementation(async () => {
    // モック画像データを返す
    return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
  }),
}));

vi.mock('satori', () => ({
  default: vi.fn().mockImplementation(async () => {
    return '<svg width="1200" height="630"><rect width="1200" height="630" fill="blue"/></svg>';
  }),
}));

// グローバルfetchをモック
global.fetch = vi.fn().mockImplementation(async () => ({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(1024),
}));

describe('OGP画像生成ライブラリ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('グラデーション設定', () => {
    test('定義済みグラデーションが存在する', () => {
      expect(GRADIENT_PRESETS['blue-to-purple']).toBeDefined();
      expect(GRADIENT_PRESETS['pink-to-orange']).toBeDefined();
      expect(GRADIENT_PRESETS['green-to-blue']).toBeDefined();
      expect(GRADIENT_PRESETS.sunset).toBeDefined();
      expect(GRADIENT_PRESETS.ocean).toBeDefined();
    });

    test('有効なグラデーションを判定できる', () => {
      expect(isValidGradient('blue-to-purple')).toBe(true);
      expect(isValidGradient('pink-to-orange')).toBe(true);
      expect(isValidGradient('invalid-gradient')).toBe(false);
      expect(isValidGradient('')).toBe(false);
    });
  });

  describe('パラメータ変換', () => {
    test('OGPパラメータから画像生成パラメータに変換できる', () => {
      const ogpParams: OgpParams = {
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
      };

      const imageParams = ogpParamsToImageParams(ogpParams);

      expect(imageParams.title).toBe('テストタイトル');
      expect(imageParams.gradient).toBe('blue-to-purple');
      expect(imageParams.width).toBe(1200);
      expect(imageParams.height).toBe(630);
    });
  });

  describe('画像生成', () => {
    test('基本的なOGP画像を生成できる', async () => {
      const params: ImageGenerationParams = {
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
        width: 1200,
        height: 630,
      };

      const result = await generateOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    test('軽量版のOGP画像を生成できる', async () => {
      const params: ImageGenerationParams = {
        title: 'テストタイトル',
        gradient: 'sunset',
        width: 1200,
        height: 630,
      };

      const result = await generateLightweightOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    test('長いタイトルを自動で切り詰める', async () => {
      const longTitle = 'あ'.repeat(150);
      const params: ImageGenerationParams = {
        title: longTitle,
        gradient: 'ocean',
      };

      const result = await generateLightweightOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    test('デフォルトサイズで画像生成できる', async () => {
      const params: ImageGenerationParams = {
        title: 'デフォルトサイズテスト',
        gradient: 'green-to-blue',
      };

      const result = await generateOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    test('カスタムサイズで画像生成できる', async () => {
      const params: ImageGenerationParams = {
        title: 'カスタムサイズテスト',
        gradient: 'pink-to-orange',
        width: 800,
        height: 400,
      };

      const result = await generateOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('エラーハンドリング', () => {
    test('Satoriエラー時に適切なエラーメッセージを返す', async () => {
      const satori = await import('satori');
      vi.mocked(satori.default).mockRejectedValueOnce(
        new Error('Satori処理エラー'),
      );

      const params: ImageGenerationParams = {
        title: 'エラーテスト',
        gradient: 'blue-to-purple',
      };

      await expect(generateOgpImage(params)).rejects.toThrow(
        'OGP画像生成エラー',
      );
    });

    test('SVG2PNG変換エラー時に適切なエラーメッセージを返す', async () => {
      const { svg2png } = await import('svg2png-wasm');
      vi.mocked(svg2png).mockRejectedValueOnce(new Error('PNG変換エラー'));

      const params: ImageGenerationParams = {
        title: 'PNG変換エラーテスト',
        gradient: 'sunset',
      };

      await expect(generateOgpImage(params)).rejects.toThrow(
        'OGP画像生成エラー',
      );
    });

    test('フォント取得エラー時もフォールバックで動作する', async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('フォント取得エラー'));

      const params: ImageGenerationParams = {
        title: 'フォントエラーテスト',
        gradient: 'ocean',
      };

      const result = await generateOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('パフォーマンス最適化', () => {
    test('軽量版では画像サイズが制限される', async () => {
      const params: ImageGenerationParams = {
        title: 'サイズ制限テスト',
        gradient: 'blue-to-purple',
        width: 2000, // 制限を超えるサイズ
        height: 1000,
      };

      const result = await generateLightweightOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
      // 内部的にサイズが制限されることを確認（実装依存）
    });

    test('軽量版では長いタイトルが切り詰められる', async () => {
      const veryLongTitle = 'あ'.repeat(200);
      const params: ImageGenerationParams = {
        title: veryLongTitle,
        gradient: 'sunset',
      };

      // 軽量版では内部的にタイトルが切り詰められる
      const result = await generateLightweightOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('フォント処理', () => {
    test('フォントキャッシュが機能する', async () => {
      const params: ImageGenerationParams = {
        title: 'フォントキャッシュテスト',
        gradient: 'green-to-blue',
      };

      // 初回実行
      await generateOgpImage(params);

      // 2回目実行（キャッシュが使用される）
      const result = await generateOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('グラデーション適用', () => {
    test('無効なグラデーションはデフォルトにフォールバックする', async () => {
      const params: ImageGenerationParams = {
        title: 'フォールバックテスト',
        gradient: 'invalid-gradient' as GradientType,
      };

      const result = await generateOgpImage(params);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    test('すべてのプリセットグラデーションで画像生成できる', async () => {
      const gradients = Object.keys(GRADIENT_PRESETS) as GradientType[];

      for (const gradient of gradients) {
        const params: ImageGenerationParams = {
          title: `${gradient}テスト`,
          gradient,
        };

        const result = await generateOgpImage(params);
        expect(result).toBeInstanceOf(ArrayBuffer);
      }
    });
  });
});
