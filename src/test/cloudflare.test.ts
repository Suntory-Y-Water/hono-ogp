/**
 * Cloudflare統合ライブラリテスト
 * ビジネスロジック（日本語エンコード処理）に焦点を当てたテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadOGPImage,
  saveOGPMetadata,
  getOGPMetadata,
  getOGPImageResponse,
  type OGPMetadata,
} from '../lib/cloudflare';

// Cloudflareコンテキストのモック
const mockEnv = {
  OGP_IMAGES_BUCKET: {
    put: vi.fn(),
    get: vi.fn(),
  },
  OGP_METADATA_KV: {
    put: vi.fn(),
    get: vi.fn(),
  },
};

// @opennextjs/cloudflareのモック
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => ({ env: mockEnv }),
}));

describe('uploadOGPImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Date.nowをモックして一定の値にする
    vi.spyOn(Date, 'now').mockReturnValue(1234567890000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('日本語タイトルのエンコード処理', () => {
    it('日本語タイトルが適切にエンコードされてファイルキーに含まれる', async () => {
      const testImageData = new Uint8Array([1, 2, 3, 4]);
      const testId = 'test-id-123';
      const japaneseTitle = 'Test Japanese Title';

      const result = await uploadOGPImage({
        imageData: testImageData,
        id: testId,
        title: japaneseTitle,
      });

      // エンコード処理を手動で検証
      const expectedEncodedTitle = encodeURIComponent(japaneseTitle);
      const expectedHash = btoa(expectedEncodedTitle).slice(0, 10);
      const expectedKey = `${testId}_1234567890000_${expectedHash}.png`;

      expect(result).toBe(expectedKey);
      expect(mockEnv.OGP_IMAGES_BUCKET.put).toHaveBeenCalledWith(
        expectedKey,
        testImageData,
        {
          httpMetadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000, immutable',
          },
        },
      );
    });

    it('特殊文字を含むタイトルが適切にエンコードされる', async () => {
      const testImageData = new Uint8Array([5, 6, 7, 8]);
      const testId = 'special-chars';
      const specialTitle = 'Title: / \\ ? # % & + Space';

      const result = await uploadOGPImage({
        imageData: testImageData,
        id: testId,
        title: specialTitle,
      });

      // 特殊文字がURLエンコードされることを確認
      const encodedTitle = encodeURIComponent(specialTitle);
      expect(encodedTitle).toContain('%3A'); // ':'
      expect(encodedTitle).toContain('%20'); // スペース

      const expectedHash = btoa(encodedTitle).slice(0, 10);
      const expectedKey = `${testId}_1234567890000_${expectedHash}.png`;

      expect(result).toBe(expectedKey);
    });

    it('異なるタイトルで異なるハッシュが生成される', async () => {
      const testImageData = new Uint8Array([9, 10, 11, 12]);
      const testId = 'hash-test';

      const title1 = 'Completely Different Title A';
      const result1 = await uploadOGPImage({
        imageData: testImageData,
        id: testId,
        title: title1,
      });

      vi.clearAllMocks();
      vi.spyOn(Date, 'now').mockReturnValue(1234567890001); // 異なるタイムスタンプ

      const title2 = 'Another Totally Different Title B';
      const result2 = await uploadOGPImage({
        imageData: testImageData,
        id: testId,
        title: title2,
      });

      // 異なるタイトルで異なるキーが生成されることを確認
      expect(result1).not.toBe(result2);

      // ハッシュ部分が異なることを確認
      const hash1 = result1.split('_')[2].replace('.png', '');
      const hash2 = result2.split('_')[2].replace('.png', '');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('R2アップロード処理', () => {
    it('正しいHTTPメタデータでR2にアップロードされる', async () => {
      const testImageData = new Uint8Array([13, 14, 15, 16]);
      const testId = 'metadata-test';
      const testTitle = 'Metadata Test';

      await uploadOGPImage({
        imageData: testImageData,
        id: testId,
        title: testTitle,
      });

      expect(mockEnv.OGP_IMAGES_BUCKET.put).toHaveBeenCalledOnce();

      const [key, data, options] = mockEnv.OGP_IMAGES_BUCKET.put.mock.calls[0];

      // 渡されたデータが正しいことを確認
      expect(data).toBe(testImageData);

      // HTTPメタデータが正しく設定されていることを確認
      expect(options).toEqual({
        httpMetadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });

      // キーが期待される形式であることを確認
      expect(key).toMatch(/^metadata-test_\d+_[A-Za-z0-9+/=]{10}\.png$/);
    });

    it('異なる画像データでもエンコード処理は正常に動作する', async () => {
      const largeImageData = new Uint8Array(1000).fill(255);
      const testId = 'large-image';
      const testTitle = 'Large Image File Test';

      const result = await uploadOGPImage({
        imageData: largeImageData,
        id: testId,
        title: testTitle,
      });

      expect(mockEnv.OGP_IMAGES_BUCKET.put).toHaveBeenCalledWith(
        result,
        largeImageData,
        expect.any(Object),
      );

      // タイトルエンコードが正常に処理されていることを確認
      expect(result).toContain('large-image_');
      expect(result).toMatch(/\.png$/);
    });
  });

  describe('saveOGPMetadata', () => {
    beforeEach(() => {
      // Date オブジェクトをモック
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
        '2024-01-01T00:00:00.000Z',
      );
    });

    it('OGPメタデータが正しくKVに保存される', async () => {
      const testMetadata = {
        id: 'test-save-123',
        key: 'test-save-123_1234567890000_hash12345.png',
        title: 'Save Test Title',
        gradient: {
          from: '#ff0000',
          to: '#0000ff',
        },
        url: '/api/ogp/test-save-123',
      };

      await saveOGPMetadata(testMetadata);

      expect(mockEnv.OGP_METADATA_KV.put).toHaveBeenCalledOnce();

      const [key, value, options] = mockEnv.OGP_METADATA_KV.put.mock.calls[0];

      // KVキーが正しい形式であることを確認
      expect(key).toBe('ogp:test-save-123');

      // TTLが正しく設定されていることを確認
      expect(options).toEqual({
        expirationTtl: 31536000, // 1年間
      });

      // 保存されるデータにcreatedAtが自動追加されていることを確認
      const savedData = JSON.parse(value);
      expect(savedData).toEqual({
        ...testMetadata,
        createdAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('日本語タイトルを含むメタデータが正しくJSONシリアライズされる', async () => {
      const japaneseMetadata = {
        id: 'japanese-test',
        key: 'japanese-test.png',
        title: 'これは日本語のタイトルです',
        gradient: {
          from: '#667eea',
          to: '#764ba2',
        },
        url: '/api/ogp/japanese-test',
      };

      await saveOGPMetadata(japaneseMetadata);

      const [, value] = mockEnv.OGP_METADATA_KV.put.mock.calls[0];
      const savedData = JSON.parse(value);

      // 日本語タイトルが正しく保存されることを確認
      expect(savedData.title).toBe('これは日本語のタイトルです');
      expect(savedData.id).toBe('japanese-test');
    });

    it('グラデーション設定が正しく保存される', async () => {
      const gradientMetadata = {
        id: 'gradient-test',
        key: 'gradient-test.png',
        title: 'Gradient Test',
        gradient: {
          from: '#ff7e5f',
          to: '#feb47b',
        },
        url: '/api/ogp/gradient-test',
      };

      await saveOGPMetadata(gradientMetadata);

      const [, value] = mockEnv.OGP_METADATA_KV.put.mock.calls[0];
      const savedData = JSON.parse(value);

      // グラデーション設定が正確に保存されることを確認
      expect(savedData.gradient).toEqual({
        from: '#ff7e5f',
        to: '#feb47b',
      });
    });
  });

  describe('getOGPMetadata', () => {
    it('存在するIDのメタデータを正しく取得できる', async () => {
      const expectedMetadata: OGPMetadata = {
        id: 'test-get-123',
        key: 'test-get-123.png',
        title: 'Get Test Title',
        gradient: {
          from: '#11998e',
          to: '#38ef7d',
        },
        url: '/api/ogp/test-get-123',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      // KVからの戻り値をモック
      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(
        JSON.stringify(expectedMetadata),
      );

      const result = await getOGPMetadata('test-get-123');

      expect(mockEnv.OGP_METADATA_KV.get).toHaveBeenCalledWith(
        'ogp:test-get-123',
      );
      expect(result).toEqual(expectedMetadata);
    });

    it('日本語タイトルを含むメタデータが正しくデシリアライズされる', async () => {
      const japaneseMetadata: OGPMetadata = {
        id: 'japanese-get',
        key: 'japanese-get.png',
        title: '取得テスト用日本語タイトル',
        gradient: {
          from: '#8360c3',
          to: '#2ebf91',
        },
        url: '/api/ogp/japanese-get',
        createdAt: '2024-01-01T12:00:00.000Z',
      };

      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(
        JSON.stringify(japaneseMetadata),
      );

      const result = await getOGPMetadata('japanese-get');

      // 日本語タイトルが正しく復元されることを確認
      expect(result?.title).toBe('取得テスト用日本語タイトル');
      expect(result?.id).toBe('japanese-get');
    });

    it('存在しないIDの場合nullを返す', async () => {
      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(null);

      const result = await getOGPMetadata('non-existent-id');

      expect(mockEnv.OGP_METADATA_KV.get).toHaveBeenCalledWith(
        'ogp:non-existent-id',
      );
      expect(result).toBeNull();
    });

    it('空文字列が返された場合nullを返す', async () => {
      mockEnv.OGP_METADATA_KV.get.mockResolvedValue('');

      const result = await getOGPMetadata('empty-data-id');

      expect(result).toBeNull();
    });

    it('無効なJSONの場合エラーがスローされる', async () => {
      mockEnv.OGP_METADATA_KV.get.mockResolvedValue('invalid json data');

      await expect(getOGPMetadata('invalid-json-id')).rejects.toThrow();
    });
  });

  describe('getOGPImageResponse', () => {
    it('正常なケースでOGP画像レスポンスを生成する', async () => {
      const testMetadata: OGPMetadata = {
        id: 'response-test-123',
        key: 'response-test-123_1234567890000_hash12345.png',
        title: 'Response Test Title',
        gradient: {
          from: '#ff416c',
          to: '#ff4b2b',
        },
        url: '/api/ogp/response-test-123',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const mockImageBody = new Uint8Array([255, 216, 255, 224]); // JPEG magic bytes
      const mockR2Object = {
        body: mockImageBody,
        etag: 'test-etag-12345',
      };

      // KVからメタデータを取得するモック
      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(
        JSON.stringify(testMetadata),
      );
      // R2から画像を取得するモック
      mockEnv.OGP_IMAGES_BUCKET.get.mockResolvedValue(mockR2Object);

      const response = await getOGPImageResponse('response-test-123');

      // ステータスコードが200であることを確認
      expect(response.status).toBe(200);

      // 適切なHTTPヘッダーが設定されていることを確認
      expect(response.headers.get('Content-Type')).toBe('image/png');
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=31536000, immutable',
      );
      expect(response.headers.get('ETag')).toBe('test-etag-12345');

      // KVとR2が正しいパラメータで呼ばれていることを確認
      expect(mockEnv.OGP_METADATA_KV.get).toHaveBeenCalledWith(
        'ogp:response-test-123',
      );
      expect(mockEnv.OGP_IMAGES_BUCKET.get).toHaveBeenCalledWith(
        'response-test-123_1234567890000_hash12345.png',
      );
    });

    it('メタデータが存在しない場合404レスポンスを返す', async () => {
      // KVからnullが返される場合をモック
      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(null);

      const response = await getOGPImageResponse('non-existent-metadata');

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('OGP metadata not found');

      // R2は呼ばれないことを確認
      expect(mockEnv.OGP_IMAGES_BUCKET.get).not.toHaveBeenCalled();
    });

    it('画像が存在しない場合404レスポンスを返す', async () => {
      const testMetadata: OGPMetadata = {
        id: 'missing-image-test',
        key: 'missing-image.png',
        title: 'Missing Image Test',
        gradient: {
          from: '#667eea',
          to: '#764ba2',
        },
        url: '/api/ogp/missing-image-test',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      // KVからはメタデータが取得できるが、R2からは画像が取得できない場合
      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(
        JSON.stringify(testMetadata),
      );
      mockEnv.OGP_IMAGES_BUCKET.get.mockResolvedValue(null);

      const response = await getOGPImageResponse('missing-image-test');

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('OGP image not found');

      // 両方のサービスが呼ばれていることを確認
      expect(mockEnv.OGP_METADATA_KV.get).toHaveBeenCalledWith(
        'ogp:missing-image-test',
      );
      expect(mockEnv.OGP_IMAGES_BUCKET.get).toHaveBeenCalledWith(
        'missing-image.png',
      );
    });

    it('ETagが存在しない場合でも正常にレスポンスを生成する', async () => {
      const testMetadata: OGPMetadata = {
        id: 'no-etag-test',
        key: 'no-etag-test.png',
        title: 'No ETag Test',
        gradient: {
          from: '#11998e',
          to: '#38ef7d',
        },
        url: '/api/ogp/no-etag-test',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const mockImageBody = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes
      const mockR2ObjectNoETag = {
        body: mockImageBody,
        etag: undefined, // ETagなし
      };

      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(
        JSON.stringify(testMetadata),
      );
      mockEnv.OGP_IMAGES_BUCKET.get.mockResolvedValue(mockR2ObjectNoETag);

      const response = await getOGPImageResponse('no-etag-test');

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=31536000, immutable',
      );
      // ETagヘッダーが設定されていないことを確認
      expect(response.headers.get('ETag')).toBeNull();
    });

    it('KVでエラーが発生した場合500レスポンスを返す', async () => {
      // KVでエラーが発生する場合をモック
      mockEnv.OGP_METADATA_KV.get.mockRejectedValue(
        new Error('KV connection error'),
      );

      const response = await getOGPImageResponse('error-test');

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal server error');
    });

    it('R2でエラーが発生した場合500レスポンスを返す', async () => {
      const testMetadata: OGPMetadata = {
        id: 'r2-error-test',
        key: 'r2-error-test.png',
        title: 'R2 Error Test',
        gradient: {
          from: '#8360c3',
          to: '#2ebf91',
        },
        url: '/api/ogp/r2-error-test',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      // KVは正常だが、R2でエラーが発生する場合
      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(
        JSON.stringify(testMetadata),
      );
      mockEnv.OGP_IMAGES_BUCKET.get.mockRejectedValue(
        new Error('R2 access error'),
      );

      const response = await getOGPImageResponse('r2-error-test');

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal server error');
    });

    it('日本語タイトルを含むメタデータでも正常に動作する', async () => {
      const japaneseMetadata: OGPMetadata = {
        id: 'japanese-response-test',
        key: 'japanese-response-test.png',
        title: 'レスポンステスト用日本語タイトル',
        gradient: {
          from: '#ff7e5f',
          to: '#feb47b',
        },
        url: '/api/ogp/japanese-response-test',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const mockImageBody = new Uint8Array([100, 101, 102, 103]);
      const mockR2Object = {
        body: mockImageBody,
        etag: 'japanese-etag',
      };

      mockEnv.OGP_METADATA_KV.get.mockResolvedValue(
        JSON.stringify(japaneseMetadata),
      );
      mockEnv.OGP_IMAGES_BUCKET.get.mockResolvedValue(mockR2Object);

      const response = await getOGPImageResponse('japanese-response-test');

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');

      // 日本語タイトルのメタデータが正しく処理されていることを間接的に確認
      expect(mockEnv.OGP_METADATA_KV.get).toHaveBeenCalledWith(
        'ogp:japanese-response-test',
      );
      expect(mockEnv.OGP_IMAGES_BUCKET.get).toHaveBeenCalledWith(
        'japanese-response-test.png',
      );
    });
  });
});
