/**
 * Cloudflare統合ライブラリ
 * KV操作とR2画像ストレージ機能を提供
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
  icon?: string;
  author?: string;
  createdAt: string;
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
 * 画像をR2バケットに保存
 */
export async function uploadImageToR2(file: File): Promise<string> {
  const { env } = getCloudflareContext();

  const imageId = crypto.randomUUID();
  const extension = file.name.split('.').pop() || 'jpg';
  const key = `avatar/${imageId}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();

  console.log(env.OGP_IMAGES);

  await env.OGP_IMAGES.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return key;
}

/**
 * R2バケットから画像を取得してBase64エンコードして返す
 */
export async function getImageAsBase64(key: string): Promise<string | null> {
  const { env } = getCloudflareContext();

  const object = await env.OGP_IMAGES.get(key);
  if (!object) {
    return null;
  }

  const arrayBuffer = await object.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // チャンクに分けてBase64変換（スタックオーバーフロー回避）
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binaryString += String.fromCharCode(...chunk);
  }
  const base64 = btoa(binaryString);

  const contentType = object.httpMetadata?.contentType || 'image/jpeg';
  return `data:${contentType};base64,${base64}`;
}
