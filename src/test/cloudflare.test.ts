/**
 * Cloudflare統合ライブラリテスト
 * ビジネスロジック（日本語エンコード処理）に焦点を当てたテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveOGPMetadata,
  getOGPMetadata,
  type OGPMetadata,
} from '../lib/cloudflare';

// Cloudflareコンテキストのモック
const mockEnv = {
  OGP_METADATA_KV: {
    put: vi.fn(),
    get: vi.fn(),
  },
};

// @opennextjs/cloudflareのモック
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => ({ env: mockEnv }),
}));

describe('saveOGPMetadata', () => {
  beforeEach(() => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
      '2024-01-01T00:00:00.000Z',
    );
  });

  it('OGPメタデータが正しくKVに保存される', async () => {
    const testMetadata = {
      id: 'test-save-123',
      key: 'test-save-123.png',
      title: 'Save Test Title',
      gradient: {
        from: '#ff0000',
        to: '#0000ff',
      },
      url: '/api/ogp/test-save-123',
    };

    await saveOGPMetadata(testMetadata);

    expect(mockEnv.OGP_METADATA_KV.put).toHaveBeenCalledWith(
      'ogp:test-save-123',
      expect.stringContaining('"id":"test-save-123"'),
      { expirationTtl: 31536000 }
    );
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

    mockEnv.OGP_METADATA_KV.get.mockResolvedValue(
      JSON.stringify(expectedMetadata),
    );

    const result = await getOGPMetadata('test-get-123');

    expect(mockEnv.OGP_METADATA_KV.get).toHaveBeenCalledWith(
      'ogp:test-get-123',
    );
    expect(result).toEqual(expectedMetadata);
  });

  it('存在しないIDの場合nullを返す', async () => {
    mockEnv.OGP_METADATA_KV.get.mockResolvedValue(null);

    const result = await getOGPMetadata('non-existent-id');

    expect(result).toBeNull();
  });
});
