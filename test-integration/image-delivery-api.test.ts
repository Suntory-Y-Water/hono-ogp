/**
 * OGP画像配信APIのテスト
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { SELF } from 'cloudflare:test';

/**
 * メタデータレスポンス型定義
 */
type MetadataResponse = {
  success: boolean;
  metadata?: {
    id: string;
    title: string;
    gradient: string;
    r2Url: string;
    createdAt: string;
    updatedAt: string;
  };
  imageUrl?: string;
  error?: string;
};

// 依存関係をモック
vi.mock('@/lib/cloudflare', () => ({
  getOgpImage: vi.fn().mockImplementation(async ({ id }: { id: string }) => {
    if (id === 'test123') {
      return {
        metadata: {
          id: 'test123',
          title: 'テストタイトル',
          gradient: 'blue-to-purple',
          r2Url: 'images/test123_123456_abc123.png',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        imageData: {
          body: new ReadableStream({
            start(controller) {
              // PNG header
              const pngHeader = new Uint8Array([
                137, 80, 78, 71, 13, 10, 26, 10,
              ]);
              controller.enqueue(pngHeader);
              controller.close();
            },
          }),
        },
      };
    }
    return null;
  }),
}));

describe('OGP画像配信API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/ogp/[id]', () => {
    test('存在する画像IDで画像を取得できる', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'GET',
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=31536000, immutable',
      );
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('X-OGP-ID')).toBe('test123');
      expect(response.headers.get('X-OGP-Created')).toBe(
        '2024-01-01T00:00:00.000Z',
      );

      const imageData = await response.arrayBuffer();
      expect(imageData.byteLength).toBeGreaterThan(0);

      // PNG headerの確認
      const uint8Array = new Uint8Array(imageData);
      expect(uint8Array[0]).toBe(137); // PNG signature
      expect(uint8Array[1]).toBe(80); // P
      expect(uint8Array[2]).toBe(78); // N
      expect(uint8Array[3]).toBe(71); // G
    });

    test('存在しない画像IDで404エラーを返す', async () => {
      const response = await SELF.fetch(
        'http://localhost/api/ogp/nonexistent',
        {
          method: 'GET',
        },
      );

      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('text/plain');

      const text = await response.text();
      expect(text).toBe('画像が見つかりません');
    });

    test('無効なID形式で400エラーを返す', async () => {
      const response = await SELF.fetch(
        'http://localhost/api/ogp/invalid-id!',
        {
          method: 'GET',
        },
      );

      expect(response.status).toBe(400);

      const text = await response.text();
      expect(text).toBe('無効なID形式です');
    });

    test('空のIDで400エラーを返す', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/', {
        method: 'GET',
      });

      expect(response.status).toBe(404); // ルートが見つからない
    });

    test('特殊文字を含むIDで400エラーを返す', async () => {
      const invalidIds = [
        'test@123',
        'test-123',
        'test_123',
        'test/123',
        'test?123',
      ];

      for (const invalidId of invalidIds) {
        const response = await SELF.fetch(
          `http://localhost/api/ogp/${invalidId}`,
          {
            method: 'GET',
          },
        );

        expect(response.status).toBe(400);

        const text = await response.text();
        expect(text).toBe('無効なID形式です');
      }
    });

    test('英数字のみのIDは有効', async () => {
      const validIds = ['test123', 'ABC123', 'abc', '123', 'Test123ABC'];

      for (const validId of validIds) {
        const response = await SELF.fetch(
          `http://localhost/api/ogp/${validId}`,
          {
            method: 'GET',
          },
        );

        // 404は正常（存在しないだけ）、400でなければOK
        expect(response.status).not.toBe(400);
        expect([200, 404]).toContain(response.status);
      }
    });

    test('ストレージエラー時に適切なエラーレスポンスを返す', async () => {
      const { getOgpImage } = await import('@/lib/cloudflare');
      vi.mocked(getOgpImage).mockRejectedValueOnce(
        new Error('connection failed'),
      );

      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'GET',
      });

      expect(response.status).toBe(503);

      const text = await response.text();
      expect(text).toBe('ストレージへの接続に失敗しました');
    });

    test('タイムアウトエラー時に適切なエラーレスポンスを返す', async () => {
      const { getOgpImage } = await import('@/lib/cloudflare');
      vi.mocked(getOgpImage).mockRejectedValueOnce(
        new Error('timeout occurred'),
      );

      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'GET',
      });

      expect(response.status).toBe(408);

      const text = await response.text();
      expect(text).toBe('画像取得がタイムアウトしました');
    });
  });

  describe('GET /api/ogp/[id]/meta', () => {
    test('存在する画像IDでメタデータを取得できる', async () => {
      const response = await SELF.fetch(
        'http://localhost/api/ogp/test123/meta',
        {
          method: 'GET',
        },
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain(
        'application/json',
      );

      const result = await response.json<MetadataResponse>();
      expect(result.success).toBe(true);
      expect(result.metadata).toMatchObject({
        id: 'test123',
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
        r2Url: 'images/test123_123456_abc123.png',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      expect(result.imageUrl).toBe('/api/ogp/test123');
    });

    test('存在しない画像IDでメタデータ取得時に404エラーを返す', async () => {
      const response = await SELF.fetch(
        'http://localhost/api/ogp/nonexistent/meta',
        {
          method: 'GET',
        },
      );

      expect(response.status).toBe(404);

      const result = await response.json<MetadataResponse>();
      expect(result.error).toBe('画像が見つかりません');
    });

    test('無効なID形式でメタデータ取得時に400エラーを返す', async () => {
      const response = await SELF.fetch(
        'http://localhost/api/ogp/invalid-id!/meta',
        {
          method: 'GET',
        },
      );

      expect(response.status).toBe(400);

      const result = await response.json<MetadataResponse>();
      expect(result.error).toBe('無効なIDです');
    });
  });

  describe('OPTIONS /api/ogp/[id]', () => {
    test('CORS対応のOPTIONSリクエストが正常に動作する', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'GET, OPTIONS',
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type',
      );
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });

  describe('無効なメソッド', () => {
    test('POSTメソッドは許可されていない', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(405);

      const text = await response.text();
      expect(text).toBe(
        'メソッドが許可されていません。GET のみサポートしています。',
      );
    });

    test('PUTメソッドは許可されていない', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(405);
    });

    test('DELETEメソッドは許可されていない', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'DELETE',
      });

      expect(response.status).toBe(405);
    });
  });

  describe('レスポンスヘッダー', () => {
    test('画像レスポンスで適切なヘッダーが設定される', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'GET',
      });

      expect(response.headers.get('Content-Type')).toBe('image/png');
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=31536000, immutable',
      );
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('X-OGP-ID')).toBe('test123');
      expect(response.headers.get('X-OGP-Created')).toBeDefined();
    });

    test('エラーレスポンスで適切なヘッダーが設定される', async () => {
      const response = await SELF.fetch(
        'http://localhost/api/ogp/nonexistent',
        {
          method: 'GET',
        },
      );

      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('セキュリティ', () => {
    test('パストラバーサル攻撃を防ぐ', async () => {
      const maliciousIds = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '../../app/lib',
      ];

      for (const maliciousId of maliciousIds) {
        const response = await SELF.fetch(
          `http://localhost/api/ogp/${encodeURIComponent(maliciousId)}`,
          {
            method: 'GET',
          },
        );

        expect(response.status).toBe(400);

        const text = await response.text();
        expect(text).toBe('無効なID形式です');
      }
    });

    test('SQLインジェクション攻撃を防ぐ', async () => {
      const maliciousIds = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
      ];

      for (const maliciousId of maliciousIds) {
        const response = await SELF.fetch(
          `http://localhost/api/ogp/${encodeURIComponent(maliciousId)}`,
          {
            method: 'GET',
          },
        );

        expect(response.status).toBe(400);

        const text = await response.text();
        expect(text).toBe('無効なID形式です');
      }
    });
  });

  describe('パフォーマンス', () => {
    test('キャッシュヘッダーが適切に設定される', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/test123', {
        method: 'GET',
      });

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age=31536000'); // 1年間
      expect(cacheControl).toContain('immutable');
      expect(cacheControl).toContain('public');
    });
  });
});
