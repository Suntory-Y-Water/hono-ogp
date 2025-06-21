/**
 * OGP画像生成APIのテスト
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { SELF } from 'cloudflare:test';

/**
 * レスポンス型定義
 */
type GenerateResponse = {
  success: boolean;
  data?: {
    id: string;
    title: string;
    gradient: string;
    imageUrl: string;
    createdAt: string;
  };
  error?: {
    message: string;
    code: string;
  };
};

type HealthCheckResponse = {
  status: string;
  service: string;
  version: string;
  timestamp: string;
};

// 依存関係をモック
vi.mock('@/lib/ogp-generator', () => ({
  generateLightweightOgpImage: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
  ogpParamsToImageParams: vi.fn().mockImplementation((params) => ({
    title: params.title,
    gradient: params.gradient,
    width: 1200,
    height: 630,
  })),
  isValidGradient: vi
    .fn()
    .mockImplementation((gradient: string) =>
      [
        'blue-to-purple',
        'pink-to-orange',
        'green-to-blue',
        'sunset',
        'ocean',
      ].includes(gradient),
    ),
}));

vi.mock('@/lib/cloudflare', () => ({
  saveOgpImage: vi.fn().mockResolvedValue({
    id: 'test123',
    title: 'テストタイトル',
    gradient: 'blue-to-purple',
    r2Url: 'images/test123_123456_abc123.png',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }),
  generateOgpId: vi.fn().mockReturnValue('test123'),
}));

describe('OGP画像生成API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/ogp/generate', () => {
    test('正常なリクエストで画像を生成できる', async () => {
      const requestBody = {
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 'test123',
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
        imageUrl: '/api/ogp/test123',
        createdAt: expect.any(String),
      });
    });

    test('タイトルが空文字の場合はエラーを返す', async () => {
      const requestBody = {
        title: '',
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('タイトルが200文字を超える場合はエラーを返す', async () => {
      const requestBody = {
        title: 'あ'.repeat(201),
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('無効なグラデーションの場合はエラーを返す', async () => {
      const requestBody = {
        title: 'テストタイトル',
        gradient: 'invalid-gradient',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('タイトルが必須フィールドでない場合はエラーを返す', async () => {
      const requestBody = {
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('グラデーションが必須フィールドでない場合はエラーを返す', async () => {
      const requestBody = {
        title: 'テストタイトル',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('空白文字のみのタイトルの場合はエラーを返す', async () => {
      const requestBody = {
        title: '   ',
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('不正なJSONの場合はエラーを返す', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });

    test('Content-Typeが正しくない場合はエラーを返す', async () => {
      const requestBody = {
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);
    });

    test('画像生成でエラーが発生した場合は適切なエラーレスポンスを返す', async () => {
      const { generateLightweightOgpImage } = await import(
        '@/lib/ogp-generator'
      );
      vi.mocked(generateLightweightOgpImage).mockRejectedValueOnce(
        new Error('OGP画像生成エラー: テスト用エラー'),
      );

      const requestBody = {
        title: 'エラーテスト',
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IMAGE_GENERATION_ERROR');
    });

    test('WASM初期化エラーの場合は適切なエラーレスポンスを返す', async () => {
      const { generateLightweightOgpImage } = await import(
        '@/lib/ogp-generator'
      );
      vi.mocked(generateLightweightOgpImage).mockRejectedValueOnce(
        new Error('WASM初期化エラー: 初期化失敗'),
      );

      const requestBody = {
        title: 'WASMエラーテスト',
        gradient: 'sunset',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WASM_INIT_ERROR');
    });

    test('処理時間制限エラーの場合は適切なエラーレスポンスを返す', async () => {
      const { generateLightweightOgpImage } = await import(
        '@/lib/ogp-generator'
      );
      vi.mocked(generateLightweightOgpImage).mockRejectedValueOnce(
        new Error('timeout: CPU time limit exceeded'),
      );

      const requestBody = {
        title: 'タイムアウトテスト',
        gradient: 'ocean',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(408);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT_ERROR');
    });
  });

  describe('GET /api/ogp/generate', () => {
    test('ヘルスチェックが正常に動作する', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json<HealthCheckResponse>();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('OGP Image Generator API');
      expect(result.version).toBe('1.0.0');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('OPTIONS /api/ogp/generate', () => {
    test('CORS対応のOPTIONSリクエストが正常に動作する', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'POST, OPTIONS',
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type',
      );
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });

  describe('無効なメソッド', () => {
    test('PUTメソッドは許可されていない', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(405);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('METHOD_NOT_ALLOWED');
    });

    test('DELETEメソッドは許可されていない', async () => {
      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'DELETE',
      });

      expect(response.status).toBe(405);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('レスポンスヘッダー', () => {
    test('正常なレスポンスで適切なCORSヘッダーが設定される', async () => {
      const requestBody = {
        title: 'ヘッダーテスト',
        gradient: 'green-to-blue',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'POST, OPTIONS',
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type',
      );
    });

    test('エラーレスポンスで適切なCORSヘッダーが設定される', async () => {
      const requestBody = {
        title: '',
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('エッジケース', () => {
    test('長いタイトル（200文字ちょうど）で正常に動作する', async () => {
      const requestBody = {
        title: 'あ'.repeat(200),
        gradient: 'pink-to-orange',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(true);
    });

    test('すべてのサポートされているグラデーションで正常に動作する', async () => {
      const gradients = [
        'blue-to-purple',
        'pink-to-orange',
        'green-to-blue',
        'sunset',
        'ocean',
      ];

      for (const gradient of gradients) {
        const requestBody = {
          title: `${gradient}テスト`,
          gradient,
        };

        const response = await SELF.fetch('http://localhost/api/ogp/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        expect(response.status).toBe(200);

        const result = await response.json<GenerateResponse>();
        expect(result.success).toBe(true);
        expect(result.data?.gradient).toBe(gradient);
      }
    });

    test('タイトルの前後の空白文字が除去される', async () => {
      const requestBody = {
        title: '  テストタイトル  ',
        gradient: 'blue-to-purple',
      };

      const response = await SELF.fetch('http://localhost/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);

      const result = await response.json<GenerateResponse>();
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('テストタイトル');
    });
  });
});
