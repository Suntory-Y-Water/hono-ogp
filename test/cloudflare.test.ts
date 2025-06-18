/**
 * Cloudflareストレージ操作のテスト
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  saveOgpMetadata,
  getOgpMetadata,
  deleteOgpMetadata,
  generateTitleHash,
  saveImageToR2,
  getImageFromR2,
  deleteImageFromR2,
  saveOgpImage,
  getOgpImage,
  deleteOgpImage,
  generateOgpId,
  type OgpMetadata,
  type OgpParams,
} from '../app/lib/cloudflare';

describe('Cloudflareストレージ操作', () => {
  let mockKv: any;
  let mockR2: any;

  beforeEach(() => {
    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    mockR2 = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe('ユーティリティ関数', () => {
    test('ユニークなIDが生成される', () => {
      const id1 = generateOgpId();
      const id2 = generateOgpId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-z0-9]+$/);
      expect(id2).toMatch(/^[a-z0-9]+$/);
    });

    test('タイトルハッシュが一致する', () => {
      const hash1 = generateTitleHash('テストタイトル');
      const hash2 = generateTitleHash('テストタイトル');

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-z0-9]{1,6}$/);
    });

    test('異なるタイトルは異なるハッシュを生成する', () => {
      const hash1 = generateTitleHash('タイトル1');
      const hash2 = generateTitleHash('タイトル2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('KVストレージ操作', () => {
    test('OGPメタデータをKVに保存できる', async () => {
      const metadata: OgpMetadata = {
        id: 'test123',
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
        r2Url: 'images/test123_123456_abc123.png',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      await saveOgpMetadata({ kv: mockKv, metadata });

      expect(mockKv.put).toHaveBeenCalledWith(
        'ogp:test123',
        JSON.stringify(metadata),
        { expirationTtl: 31536000 },
      );
    });

    test('存在するOGPメタデータをKVから取得できる', async () => {
      const metadata: OgpMetadata = {
        id: 'test123',
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
        r2Url: 'images/test123_123456_abc123.png',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockKv.get.mockResolvedValue(JSON.stringify(metadata));

      const result = await getOgpMetadata({ kv: mockKv, id: 'test123' });

      expect(mockKv.get).toHaveBeenCalledWith('ogp:test123');
      expect(result).toEqual(metadata);
    });

    test('存在しないOGPメタデータはnullを返す', async () => {
      mockKv.get.mockResolvedValue(null);

      const result = await getOgpMetadata({ kv: mockKv, id: 'nonexistent' });

      expect(result).toBeNull();
    });

    test('不正なJSONのOGPメタデータはnullを返す', async () => {
      mockKv.get.mockResolvedValue('invalid json');

      const result = await getOgpMetadata({ kv: mockKv, id: 'test123' });

      expect(result).toBeNull();
    });

    test('OGPメタデータをKVから削除できる', async () => {
      await deleteOgpMetadata({ kv: mockKv, id: 'test123' });

      expect(mockKv.delete).toHaveBeenCalledWith('ogp:test123');
    });
  });

  describe('R2ストレージ操作', () => {
    test('画像をR2に保存できる', async () => {
      const imageBuffer = new ArrayBuffer(1024);
      const mockPut = vi.fn().mockResolvedValue(undefined);
      mockR2.put = mockPut;

      const result = await saveImageToR2({
        r2: mockR2,
        id: 'test123',
        imageBuffer,
        title: 'テストタイトル',
      });

      expect(result).toMatch(/^images\/test123_\d+_[a-z0-9]{1,6}\.png$/);
      expect(mockPut).toHaveBeenCalledWith(
        expect.stringMatching(/^images\/test123_\d+_[a-z0-9]{1,6}\.png$/),
        imageBuffer,
        {
          httpMetadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000, immutable',
          },
          customMetadata: {
            ogpId: 'test123',
            title: 'テストタイトル',
            createdAt: expect.any(String),
          },
        },
      );
    });

    test('画像をR2から取得できる', async () => {
      const mockImageData = { body: new ReadableStream() };
      mockR2.get.mockResolvedValue(mockImageData);

      const result = await getImageFromR2({
        r2: mockR2,
        objectKey: 'images/test123_123456_abc123.png',
      });

      expect(mockR2.get).toHaveBeenCalledWith(
        'images/test123_123456_abc123.png',
      );
      expect(result).toBe(mockImageData);
    });

    test('画像をR2から削除できる', async () => {
      await deleteImageFromR2({
        r2: mockR2,
        objectKey: 'images/test123_123456_abc123.png',
      });

      expect(mockR2.delete).toHaveBeenCalledWith(
        'images/test123_123456_abc123.png',
      );
    });
  });

  describe('統合操作', () => {
    test('OGP画像を保存できる（メタデータと画像ファイルの統合）', async () => {
      const imageBuffer = new ArrayBuffer(1024);
      const ogpParams: OgpParams = {
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
      };

      mockR2.put.mockResolvedValue(undefined);
      mockKv.put.mockResolvedValue(undefined);

      const result = await saveOgpImage({
        kv: mockKv,
        r2: mockR2,
        id: 'test123',
        ogpParams,
        imageBuffer,
      });

      expect(result.id).toBe('test123');
      expect(result.title).toBe('テストタイトル');
      expect(result.gradient).toBe('blue-to-purple');
      expect(result.r2Url).toMatch(/^images\/test123_\d+_[a-z0-9]{1,6}\.png$/);
      expect(mockR2.put).toHaveBeenCalled();
      expect(mockKv.put).toHaveBeenCalled();
    });

    test('OGP画像を取得できる（メタデータと画像ファイルの統合）', async () => {
      const metadata: OgpMetadata = {
        id: 'test123',
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
        r2Url: 'images/test123_123456_abc123.png',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const mockImageData = { body: new ReadableStream() };

      mockKv.get.mockResolvedValue(JSON.stringify(metadata));
      mockR2.get.mockResolvedValue(mockImageData);

      const result = await getOgpImage({
        kv: mockKv,
        r2: mockR2,
        id: 'test123',
      });

      expect(result).not.toBeNull();
      expect(result!.metadata).toEqual(metadata);
      expect(result!.imageData).toBe(mockImageData);
    });

    test('存在しないOGP画像はnullを返す', async () => {
      mockKv.get.mockResolvedValue(null);

      const result = await getOgpImage({
        kv: mockKv,
        r2: mockR2,
        id: 'nonexistent',
      });

      expect(result).toBeNull();
    });

    test('メタデータは存在するが画像が存在しない場合はnullを返す', async () => {
      const metadata: OgpMetadata = {
        id: 'test123',
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
        r2Url: 'images/test123_123456_abc123.png',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockKv.get.mockResolvedValue(JSON.stringify(metadata));
      mockR2.get.mockResolvedValue(null);

      const result = await getOgpImage({
        kv: mockKv,
        r2: mockR2,
        id: 'test123',
      });

      expect(result).toBeNull();
    });

    test('OGP画像を削除できる（メタデータと画像ファイルの統合）', async () => {
      const metadata: OgpMetadata = {
        id: 'test123',
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
        r2Url: 'images/test123_123456_abc123.png',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockKv.get.mockResolvedValue(JSON.stringify(metadata));
      mockKv.delete.mockResolvedValue(undefined);
      mockR2.delete.mockResolvedValue(undefined);

      await deleteOgpImage({
        kv: mockKv,
        r2: mockR2,
        id: 'test123',
      });

      expect(mockR2.delete).toHaveBeenCalledWith(
        'images/test123_123456_abc123.png',
      );
      expect(mockKv.delete).toHaveBeenCalledWith('ogp:test123');
    });

    test('存在しないOGP画像の削除は何もしない', async () => {
      mockKv.get.mockResolvedValue(null);

      await deleteOgpImage({
        kv: mockKv,
        r2: mockR2,
        id: 'nonexistent',
      });

      expect(mockR2.delete).not.toHaveBeenCalled();
      expect(mockKv.delete).not.toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    test('空のタイトルでもハッシュを生成できる', () => {
      const hash = generateTitleHash('');
      expect(hash).toMatch(/^[a-z0-9]{1,6}$/);
    });

    test('長いタイトルでもハッシュは6文字以下になる', () => {
      const longTitle = 'あ'.repeat(1000);
      const hash = generateTitleHash(longTitle);
      expect(hash.length).toBeLessThanOrEqual(6);
    });

    test('特殊文字を含むタイトルでもハッシュを生成できる', () => {
      const specialTitle = '🎨📊💻🚀🎯';
      const hash = generateTitleHash(specialTitle);
      expect(hash).toMatch(/^[a-z0-9]{1,6}$/);
    });
  });
});
