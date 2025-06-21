/**
 * OGP画像生成Server Actionsテスト
 * ビジネスロジック（バリデーション、フォームデータ処理、統合処理）に焦点を当てたテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateOGPAction } from '../lib/actions/ogp-actions';

// 依存ライブラリのモック
vi.mock('@/lib/ogp-server', () => ({
  generateOGPImagePng: vi.fn(),
  validateOGPOptions: vi.fn(),
}));

vi.mock('@/lib/constants', () => ({
  GRADIENT_PRESETS: {
    sunset: { from: '#ff7e5f', to: '#feb47b' },
    ocean: { from: '#667eea', to: '#764ba2' },
    forest: { from: '#11998e', to: '#38ef7d' },
    purple: { from: '#8360c3', to: '#2ebf91' },
    fire: { from: '#ff416c', to: '#ff4b2b' },
  },
}));

vi.mock('@/lib/cloudflare', () => ({
  uploadOGPImage: vi.fn(),
  saveOGPMetadata: vi.fn(),
}));

// crypto.randomUUIDのモック
const mockRandomUUID = vi.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
  },
  writable: true,
});

describe('generateOGPAction', () => {
  let mockGenerateOGPImagePng: any;
  let mockValidateOGPOptions: any;
  let mockUploadOGPImage: any;
  let mockSaveOGPMetadata: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // モックの設定
    mockGenerateOGPImagePng = vi.mocked(
      (await import('@/lib/ogp-server')).generateOGPImagePng,
    );
    mockValidateOGPOptions = vi.mocked(
      (await import('@/lib/ogp-server')).validateOGPOptions,
    );
    mockUploadOGPImage = vi.mocked(
      (await import('@/lib/cloudflare')).uploadOGPImage,
    );
    mockSaveOGPMetadata = vi.mocked(
      (await import('@/lib/cloudflare')).saveOGPMetadata,
    );

    // デフォルトの成功モック
    mockValidateOGPOptions.mockReturnValue(true);
    mockGenerateOGPImagePng.mockResolvedValue(
      new Uint8Array([137, 80, 78, 71]),
    );
    mockUploadOGPImage.mockResolvedValue('test-key-123.png');
    mockSaveOGPMetadata.mockResolvedValue(undefined);
    mockRandomUUID.mockReturnValue('test-uuid-12345');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('正常なケース', () => {
    it('有効なフォームデータで成功レスポンスを返す', async () => {
      const formData = new FormData();
      formData.append('title', 'テストタイトル');
      formData.append('gradient', 'sunset');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: true,
        id: 'test-uuid-12345',
        url: '/result?id=test-uuid-12345',
      });
    });

    it('タイトルの前後の空白を適切にトリムする', async () => {
      const formData = new FormData();
      formData.append('title', '  前後に空白があるタイトル  ');
      formData.append('gradient', 'ocean');

      const result = await generateOGPAction(formData);

      expect(result.success).toBe(true);
      expect(mockGenerateOGPImagePng).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '前後に空白があるタイトル',
        }),
      );
    });

    it('異なるグラデーションプリセットで動作する', async () => {
      const formData = new FormData();
      formData.append('title', 'プリセットテスト');
      formData.append('gradient', 'forest');

      const result = await generateOGPAction(formData);

      expect(result.success).toBe(true);
      expect(mockGenerateOGPImagePng).toHaveBeenCalledWith(
        expect.objectContaining({
          gradient: { from: '#11998e', to: '#38ef7d' },
        }),
      );
    });
  });

  describe('バリデーションエラーケース', () => {
    it('タイトルが空の場合エラーを返す', async () => {
      const formData = new FormData();
      formData.append('title', '');
      formData.append('gradient', 'sunset');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: 'タイトルは必須です',
      });

      // 後続処理が呼ばれていないことを確認
      expect(mockGenerateOGPImagePng).not.toHaveBeenCalled();
    });

    it('タイトルが空白のみの場合エラーを返す', async () => {
      const formData = new FormData();
      formData.append('title', '   ');
      formData.append('gradient', 'sunset');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: 'タイトルは必須です',
      });
    });

    it('タイトルがnullの場合エラーを返す', async () => {
      const formData = new FormData();
      formData.append('gradient', 'sunset');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: 'タイトルは必須です',
      });
    });

    it('無効なグラデーションプリセットの場合エラーを返す', async () => {
      const formData = new FormData();
      formData.append('title', '有効なタイトル');
      formData.append('gradient', 'invalid-gradient');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: '有効なグラデーションを選択してください',
      });

      expect(mockGenerateOGPImagePng).not.toHaveBeenCalled();
    });

    it('グラデーションが未指定の場合エラーを返す', async () => {
      const formData = new FormData();
      formData.append('title', '有効なタイトル');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: '有効なグラデーションを選択してください',
      });
    });

    it('OGPオプションバリデーションが失敗した場合エラーを返す', async () => {
      mockValidateOGPOptions.mockReturnValue(false);

      const formData = new FormData();
      formData.append('title', '有効なタイトル');
      formData.append('gradient', 'sunset');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: 'OGPオプションが無効です',
      });

      expect(mockGenerateOGPImagePng).not.toHaveBeenCalled();
    });
  });

  describe('内部エラーケース', () => {
    it('画像生成でエラーが発生した場合適切なエラーを返す', async () => {
      mockGenerateOGPImagePng.mockRejectedValue(new Error('画像生成エラー'));

      const formData = new FormData();
      formData.append('title', '有効なタイトル');
      formData.append('gradient', 'sunset');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: 'OGP画像の生成に失敗しました',
      });

      // エラー後の処理が呼ばれていないことを確認
      expect(mockUploadOGPImage).not.toHaveBeenCalled();
      expect(mockSaveOGPMetadata).not.toHaveBeenCalled();
    });

    it('R2アップロードでエラーが発生した場合適切なエラーを返す', async () => {
      mockUploadOGPImage.mockRejectedValue(new Error('R2アップロードエラー'));

      const formData = new FormData();
      formData.append('title', '有効なタイトル');
      formData.append('gradient', 'sunset');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: 'OGP画像の生成に失敗しました',
      });

      // KV保存が呼ばれていないことを確認
      expect(mockSaveOGPMetadata).not.toHaveBeenCalled();
    });

    it('KVメタデータ保存でエラーが発生した場合適切なエラーを返す', async () => {
      mockSaveOGPMetadata.mockRejectedValue(new Error('KV保存エラー'));

      const formData = new FormData();
      formData.append('title', '有効なタイトル');
      formData.append('gradient', 'sunset');

      const result = await generateOGPAction(formData);

      expect(result).toEqual({
        success: false,
        error: 'OGP画像の生成に失敗しました',
      });
    });
  });

  describe('日本語処理', () => {
    it('日本語タイトルを正常に処理する', async () => {
      const formData = new FormData();
      formData.append('title', 'これは日本語のタイトルです');
      formData.append('gradient', 'purple');

      const result = await generateOGPAction(formData);

      expect(result.success).toBe(true);
      expect(mockGenerateOGPImagePng).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'これは日本語のタイトルです',
        }),
      );

      expect(mockUploadOGPImage).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'これは日本語のタイトルです',
        }),
      );
    });

    it('絵文字を含むタイトルを正常に処理する', async () => {
      const formData = new FormData();
      formData.append('title', '🎉 祝！新機能リリース 🚀');
      formData.append('gradient', 'fire');

      const result = await generateOGPAction(formData);

      expect(result.success).toBe(true);
      expect(mockGenerateOGPImagePng).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🎉 祝！新機能リリース 🚀',
        }),
      );
    });
  });
});
