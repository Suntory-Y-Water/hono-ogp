/**
 * Cloudflare統合ライブラリ
 * KV操作のみを提供（ImageResponseで動的生成するためR2は不使用）
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
