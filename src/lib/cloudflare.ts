/**
 * Cloudflare統合ライブラリ
 * Phase 1で必要なR2バケット操作、KV操作のみを提供
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * OGPメタデータの型定義
 */
export interface OGPMetadata {
  id: string;
  key: string;
  title: string;
  gradient: {
    from: string;
    to: string;
  };
  url: string;
  createdAt: string;
}

/**
 * 画像をR2バケットにアップロード
 */
export async function uploadOGPImage(options: {
  imageData: Uint8Array;
  id: string;
  title: string;
}): Promise<string> {
  const { env } = getCloudflareContext();
  const { imageData, id, title } = options;

  // ファイルキーを生成（メタデータ埋め込み）
  const titleHash = btoa(encodeURIComponent(title)).slice(0, 10);
  const key = `${id}_${Date.now()}_${titleHash}.png`;

  // R2にアップロード
  await env.OGP_IMAGES_BUCKET.put(key, imageData, {
    httpMetadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  return key;
}

/**
 * OGPメタデータをKVに保存
 */
export async function saveOGPMetadata(
  metadata: Omit<OGPMetadata, 'createdAt'>,
): Promise<void> {
  const { env } = getCloudflareContext();

  const fullMetadata: OGPMetadata = {
    ...metadata,
    createdAt: new Date().toISOString(),
  };

  await env.OGP_METADATA_KV.put(
    `ogp:${metadata.id}`,
    JSON.stringify(fullMetadata),
    {
      expirationTtl: 31536000, // 1年間
    },
  );
}

/**
 * KVからOGPメタデータを取得
 */
export async function getOGPMetadata(id: string): Promise<OGPMetadata | null> {
  const { env } = getCloudflareContext();

  const data = await env.OGP_METADATA_KV.get(`ogp:${id}`);
  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

/**
 * OGP画像配信用レスポンス生成
 */
export async function getOGPImageResponse(id: string): Promise<Response> {
  try {
    const { env } = getCloudflareContext();

    // KVからメタデータ取得
    const metadata = await getOGPMetadata(id);
    if (!metadata) {
      return new Response('OGP metadata not found', { status: 404 });
    }

    // R2から画像取得
    const object = await env.OGP_IMAGES_BUCKET.get(metadata.key);
    if (!object) {
      return new Response('OGP image not found', { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...(object.etag && { ETag: object.etag }),
      },
    });
  } catch (error) {
    console.error('OGP image response generation failed:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
