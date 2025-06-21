# OpenNext.js + Cloudflare 開発ガイド

## 📋 概要

このドキュメントは、`@opennextjs/cloudflare`を使用してNext.jsアプリをCloudflare Workersにデプロイする際の**開発で必ず使用する部分**に特化したガイドです。

---

## 🚀 基本セットアップ

### 1. 必要なパッケージ

```json
{
  "dependencies": {
    "@opennextjs/cloudflare": "^1.3.1"
  },
  "devDependencies": {
    "wrangler": "^4.20.5"
  }
}
```

### 2. package.json スクリプト

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

### 3. Next.js設定（next.config.ts）

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// 開発時にCloudflareバインディングを使用可能にする
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
```

---

## 🔧 Cloudflareバインディング設定

### wrangler.jsonc 基本設定

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ogp-image-generator",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "ogp-image-generator"
    }
  ],
  
  // R2バケット（画像ストレージ）
  "r2_buckets": [
    {
      "binding": "OGP_IMAGES_BUCKET",
      "bucket_name": "ogp-images"
    }
  ],
  
  // KVストレージ（メタデータ）
  "kv_namespaces": [
    {
      "binding": "OGP_METADATA_KV",
      "id": "your-kv-namespace-id"
    }
  ]
}
```

### 環境変数設定（.dev.vars）

```bash
# 開発環境用
NEXTJS_ENV=development

# 本番環境はwrangler secretsで設定
# wrangler secret put SECRET_NAME
```

---

## 🎯 Cloudflareバインディングの使用方法

### 基本的な使用パターン

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Server Component内
export default async function MyPage() {
  const { env } = getCloudflareContext();
  
  // R2バケットアクセス
  const bucket = env.OGP_IMAGES_BUCKET;
  
  // KVストレージアクセス
  const kv = env.OGP_METADATA_KV;
  
  return <div>...</div>;
}

// Server Actions内
async function myServerAction() {
  'use server';
  
  const { env, cf, ctx } = getCloudflareContext();
  
  // R2にファイルアップロード
  await env.OGP_IMAGES_BUCKET.put('file-key', fileData);
  
  // KVにデータ保存
  await env.OGP_METADATA_KV.put('key', JSON.stringify(data));
}
```

### 非同期モード（SSG使用時）

```typescript
// SSGルートで使用する場合
const context = await getCloudflareContext({ async: true });
```

### TypeScript型定義

```typescript
// cloudflare-env.d.ts
interface CloudflareEnv {
  OGP_IMAGES_BUCKET: R2Bucket;
  OGP_METADATA_KV: KVNamespace;
}
```

型定義生成コマンド：
```bash
pnpm typegen
```

---

## 📦 R2ストレージ操作

### 基本操作

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

async function uploadImage(imageData: ArrayBuffer, key: string) {
  'use server';
  
  const { env } = getCloudflareContext();
  
  // アップロード
  await env.OGP_IMAGES_BUCKET.put(key, imageData, {
    httpMetadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000, immutable'
    }
  });
  
  return `https://your-domain.com/api/images/${key}`;
}

async function getImage(key: string) {
  'use server';
  
  const { env } = getCloudflareContext();
  
  const object = await env.OGP_IMAGES_BUCKET.get(key);
  if (!object) return null;
  
  return {
    data: await object.arrayBuffer(),
    contentType: object.httpMetadata?.contentType || 'image/png'
  };
}

async function deleteImage(key: string) {
  'use server';
  
  const { env } = getCloudflareContext();
  await env.OGP_IMAGES_BUCKET.delete(key);
}
```

---

## 🗄️ KVストレージ操作

### 基本操作

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

// データ保存
async function saveOGPMetadata(id: string, title: string, gradient: string) {
  'use server';
  
  const { env } = getCloudflareContext();
  
  await env.OGP_METADATA_KV.put(
    `ogp:${id}`,
    JSON.stringify({
      id,
      title,
      gradient,
      createdAt: new Date().toISOString()
    }),
    {
      expirationTtl: 31536000 // 1年間
    }
  );
}

// データ取得
async function getOGPMetadata(id: string) {
  'use server';
  
  const { env } = getCloudflareContext();
  
  const data = await env.OGP_METADATA_KV.get(`ogp:${id}`);
  if (!data) return null;
  
  return JSON.parse(data);
}

// データ削除
async function deleteOGPMetadata(id: string) {
  'use server';
  
  const { env } = getCloudflareContext();
  await env.OGP_METADATA_KV.delete(`ogp:${id}`);
}

// 一覧取得
async function listOGPMetadata(prefix = 'ogp:') {
  'use server';
  
  const { env } = getCloudflareContext();
  
  const result = await env.OGP_METADATA_KV.list({ prefix });
  return result.keys;
}
```

---

## 🎨 OGPプロジェクト特有の実装例

### Server Actions実装

```typescript
// src/lib/actions/ogp-actions.ts
'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { generateOGPImage } from '@/lib/ogp';

export async function generateOGPAction(formData: FormData) {
  const { env } = getCloudflareContext();
  
  const title = formData.get('title') as string;
  const gradient = formData.get('gradient') as string;
  
  // OGP画像生成
  const imageBuffer = await generateOGPImage({ title, gradient });
  
  // 一意のIDを生成
  const id = crypto.randomUUID();
  const key = `${id}_${Date.now()}_${btoa(title).slice(0, 10)}.png`;
  
  // R2にアップロード
  await env.OGP_IMAGES_BUCKET.put(key, imageBuffer, {
    httpMetadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000, immutable'
    }
  });
  
  // KVにメタデータ保存
  await env.OGP_METADATA_KV.put(`ogp:${id}`, JSON.stringify({
    id,
    key,
    title,
    gradient,
    url: `https://your-domain.com/api/ogp/${id}`,
    createdAt: new Date().toISOString()
  }), {
    expirationTtl: 31536000
  });
  
  return { id, url: `/result?id=${id}` };
}

export async function getOGPDataAction(id: string) {
  const { env } = getCloudflareContext();
  
  const data = await env.OGP_METADATA_KV.get(`ogp:${id}`);
  if (!data) return null;
  
  return JSON.parse(data);
}
```

### 画像配信用Server Function

```typescript
// src/lib/ogp-image-server.ts
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getOGPImageResponse(id: string): Promise<Response> {
  const { env } = getCloudflareContext();
  
  // KVからメタデータ取得
  const metadataStr = await env.OGP_METADATA_KV.get(`ogp:${id}`);
  if (!metadataStr) {
    return new Response('Not Found', { status: 404 });
  }
  
  const metadata = JSON.parse(metadataStr);
  
  // R2から画像取得
  const object = await env.OGP_IMAGES_BUCKET.get(metadata.key);
  if (!object) {
    return new Response('Image Not Found', { status: 404 });
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': object.etag
    }
  });
}
```

---

## ⚠️ 重要な注意事項

### 1. キャッシュ無効化
```typescript
// 常にno-storeを使用
export const dynamic = 'force-dynamic';
// または
export const revalidate = 0;
```

### 2. 動的パラメータの受け取り
```typescript
// 正しい方法
export default async function Page({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  // ...
}
```


### 4. 制限事項
- **CPU時間**: 10ms制限（Free版）
- **メモリ**: 128MB制限
- **ファイルサイズ**: Worker 3MB/10MB制限
- **KV**: 1GB制限（Free版）

---

## 🔍 デバッグとトラブルシューティング

### 開発時のログ確認
```bash
# ローカル開発
pnpm dev

# プレビュー（本番環境シミュレート）
pnpm preview

# ログ確認
wrangler tail
```

### よくあるエラー

1. **"Worker exceeded the size limit"**
   - 不要なパッケージを削除
   - `pnpm build`後に`.open-next/server-functions/default/handler.mjs.meta.json`を[ESBuild Bundle Analyzer](https://esbuild.github.io/analyze/)で分析

2. **"Cannot perform I/O on behalf of a different request"**
   - グローバルなDB接続を避ける
   - リクエストごとにクライアントを作成

3. **型エラー**
   ```bash
   pnpm typegen
   ```

---

## 📚 参考リンク

- [OpenNext.js Cloudflare公式ドキュメント](https://opennext.js.org/cloudflare)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Wrangler CLI リファレンス](https://developers.cloudflare.com/workers/wrangler/)
- [R2 API リファレンス](https://developers.cloudflare.com/r2/api/)
- [KV API リファレンス](https://developers.cloudflare.com/kv/api/) 