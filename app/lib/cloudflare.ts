/**
 * Cloudflare R2とKVストレージを統合操作するライブラリ
 * OGP画像のメタデータ管理と画像ファイル保存を行う
 */

/**
 * OGP画像のメタデータ構造
 */
export interface OgpMetadata {
  id: string;
  title: string;
  gradient: string;
  r2Url: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * OGP画像生成パラメータ
 */
export interface OgpParams {
  title: string;
  gradient: string;
}

/**
 * OGP画像メタデータをKVに保存する
 */
export async function saveOgpMetadata(params: {
  kv: KVNamespace;
  metadata: OgpMetadata;
}): Promise<void> {
  const key = `ogp:${params.metadata.id}`;
  await params.kv.put(key, JSON.stringify(params.metadata), {
    expirationTtl: 31536000, // 1年間
  });
}

/**
 * OGP画像メタデータをKVから取得する
 */
export async function getOgpMetadata(params: {
  kv: KVNamespace;
  id: string;
}): Promise<OgpMetadata | null> {
  const key = `ogp:${params.id}`;
  const value = await params.kv.get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as OgpMetadata;
  } catch {
    return null;
  }
}

/**
 * OGP画像メタデータをKVから削除する
 */
export async function deleteOgpMetadata(params: {
  kv: KVNamespace;
  id: string;
}): Promise<void> {
  const key = `ogp:${params.id}`;
  await params.kv.delete(key);
}

/**
 * タイトルから短いハッシュを生成する
 */
export function generateTitleHash(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

/**
 * 画像ファイルをR2に保存する
 */
export async function saveImageToR2(params: {
  r2: R2Bucket;
  id: string;
  imageBuffer: ArrayBuffer;
  title: string;
}): Promise<string> {
  const timestamp = Date.now();
  const titleHash = generateTitleHash(params.title);
  const fileName = `${params.id}_${timestamp}_${titleHash}.png`;
  const objectKey = `images/${fileName}`;

  await params.r2.put(objectKey, params.imageBuffer, {
    httpMetadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      ogpId: params.id,
      title: params.title,
      createdAt: new Date().toISOString(),
    },
  });

  return objectKey;
}

/**
 * 画像ファイルをR2から取得する
 */
export async function getImageFromR2(params: {
  r2: R2Bucket;
  objectKey: string;
}): Promise<R2ObjectBody | null> {
  return await params.r2.get(params.objectKey);
}

/**
 * 画像ファイルをR2から削除する
 */
export async function deleteImageFromR2(params: {
  r2: R2Bucket;
  objectKey: string;
}): Promise<void> {
  await params.r2.delete(params.objectKey);
}

/**
 * OGP画像を保存する（メタデータ + 画像ファイル）
 */
export async function saveOgpImage(params: {
  kv: KVNamespace;
  r2: R2Bucket;
  id: string;
  ogpParams: OgpParams;
  imageBuffer: ArrayBuffer;
}): Promise<OgpMetadata> {
  const objectKey = await saveImageToR2({
    r2: params.r2,
    id: params.id,
    imageBuffer: params.imageBuffer,
    title: params.ogpParams.title,
  });

  const metadata: OgpMetadata = {
    id: params.id,
    title: params.ogpParams.title,
    gradient: params.ogpParams.gradient,
    r2Url: objectKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveOgpMetadata({ kv: params.kv, metadata });

  return metadata;
}

/**
 * OGP画像を取得する
 */
export async function getOgpImage(params: {
  kv: KVNamespace;
  r2: R2Bucket;
  id: string;
}): Promise<{
  metadata: OgpMetadata;
  imageData: R2ObjectBody;
} | null> {
  const metadata = await getOgpMetadata({ kv: params.kv, id: params.id });
  if (!metadata) {
    return null;
  }

  const imageData = await getImageFromR2({
    r2: params.r2,
    objectKey: metadata.r2Url,
  });
  if (!imageData) {
    return null;
  }

  return { metadata, imageData };
}

/**
 * OGP画像を削除する（メタデータ + 画像ファイル）
 */
export async function deleteOgpImage(params: {
  kv: KVNamespace;
  r2: R2Bucket;
  id: string;
}): Promise<void> {
  const metadata = await getOgpMetadata({ kv: params.kv, id: params.id });

  if (metadata) {
    await deleteImageFromR2({ r2: params.r2, objectKey: metadata.r2Url });
    await deleteOgpMetadata({ kv: params.kv, id: params.id });
  }
}

/**
 * ユニークなIDを生成する
 */
export function generateOgpId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`;
}
