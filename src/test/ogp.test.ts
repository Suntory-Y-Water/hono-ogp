/**
 * OGP画像生成ライブラリテスト
 * ビジネスロジック（グラデーションプリセット、画像生成）に焦点を当てたテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateOGPImageSvg,
  generateOGPImagePng,
  type OGPImageOptions,
} from '../lib/ogp-server';
import { GRADIENT_PRESETS } from '../lib/constants';

// サードパーティライブラリのモック
vi.mock('satori', () => ({
  default: vi.fn(),
}));

vi.mock('svg2png-wasm', () => ({
  svg2png: vi.fn(),
}));

vi.mock('@/components/features/ogp-template', () => ({
  OGPTemplate: vi.fn(),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('GRADIENT_PRESETS', () => {
  it('定義されたすべてのプリセットが正しい構造を持つ', () => {
    const presetNames = ['sunset', 'ocean', 'forest', 'purple', 'fire'];

    for (const presetName of presetNames) {
      const preset =
        GRADIENT_PRESETS[presetName as keyof typeof GRADIENT_PRESETS];

      expect(preset).toBeDefined();
      expect(preset).toHaveProperty('from');
      expect(preset).toHaveProperty('to');
      expect(typeof preset.from).toBe('string');
      expect(typeof preset.to).toBe('string');

      // カラーコード形式の確認（#で始まる6桁の16進数）
      expect(preset.from).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.to).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('特定のプリセット値が期待される値と一致する', () => {
    expect(GRADIENT_PRESETS.sunset).toEqual({
      from: '#ff7e5f',
      to: '#feb47b',
    });

    expect(GRADIENT_PRESETS.ocean).toEqual({
      from: '#667eea',
      to: '#764ba2',
    });
  });
});

describe('generateOGPImageSvg', () => {
  let mockSatori: any;
  let mockOGPTemplate: any;
  const mockFetch = vi.mocked(global.fetch);

  beforeEach(async () => {
    vi.clearAllMocks();

    // 動的インポートでモックを設定
    mockSatori = vi.mocked((await import('satori')).default);
    mockOGPTemplate = vi.mocked(
      (await import('@/components/features/ogp-template')).OGPTemplate,
    );

    // フォント取得のモック
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000)),
    } as Response);

    // テンプレート生成のモック
    mockOGPTemplate.mockReturnValue({
      type: 'div',
      props: { children: 'Mocked Template' },
    } as any);

    // Satori SVG生成のモック
    mockSatori.mockResolvedValue('<svg>test svg content</svg>');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('基本的なオプションでSVGを生成する', async () => {
    const options: OGPImageOptions = {
      title: 'Test Title',
    };

    const result = await generateOGPImageSvg(options);

    expect(result).toBe('<svg>test svg content</svg>');
    expect(mockOGPTemplate).toHaveBeenCalledWith({
      title: 'Test Title',
      gradient: { from: '#667eea', to: '#764ba2' },
    });
  });

  it('カスタムグラデーションでSVGを生成する', async () => {
    const customGradient = {
      from: '#ff0000',
      to: '#0000ff',
    };
    const options: OGPImageOptions = {
      title: 'Custom Gradient Title',
      gradient: customGradient,
    };

    await generateOGPImageSvg(options);

    expect(mockOGPTemplate).toHaveBeenCalledWith({
      title: 'Custom Gradient Title',
      gradient: customGradient,
    });
  });

  it('エラー発生時は適切なエラーをスローする', async () => {
    mockSatori.mockRejectedValue(new Error('Satori processing error'));

    const options: OGPImageOptions = {
      title: 'Error Test',
    };

    await expect(generateOGPImageSvg(options)).rejects.toThrow(
      'OGP SVG generation failed',
    );
  });
});

describe('generateOGPImagePng', () => {
  let mockSatori: any;
  let mockSvg2png: any;
  const mockFetch = vi.mocked(global.fetch);

  beforeEach(async () => {
    vi.clearAllMocks();

    // 動的インポートでモックを設定
    mockSatori = vi.mocked((await import('satori')).default);
    mockSvg2png = vi.mocked((await import('svg2png-wasm')).svg2png);

    // 基本的なモック設定
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000)),
    } as Response);

    mockSatori.mockResolvedValue('<svg>test svg</svg>');
    mockSvg2png.mockResolvedValue(new Uint8Array([137, 80, 78, 71])); // PNG magic bytes
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('基本的なオプションでPNG画像を生成する', async () => {
    const options: OGPImageOptions = {
      title: 'PNG Generation Test',
    };

    const result = await generateOGPImagePng(options);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(mockSvg2png).toHaveBeenCalledWith('<svg>test svg</svg>');
  });

  it('エラー発生時は適切なエラーをスローする', async () => {
    mockSvg2png.mockRejectedValue(new Error('PNG conversion error'));

    const options: OGPImageOptions = {
      title: 'PNG Error Test',
    };

    await expect(generateOGPImagePng(options)).rejects.toThrow(
      'OGP PNG generation failed',
    );
  });
});
