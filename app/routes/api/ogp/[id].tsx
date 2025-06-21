/**
 * OGP画像配信API
 * 保存済みのOGP画像を取得して配信する
 */

import { Hono } from 'hono';
import { getOgpImage } from '../../../lib/cloudflare';

const app = new Hono<{ Bindings: Env }>();

/**
 * エラーレスポンス生成ヘルパー
 */
function createErrorResponse(params: {
  message: string;
  status: number;
}): Response {
  return new Response(params.message, {
    status: params.status,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * OGP画像配信エンドポイント
 * GET /api/ogp/[id]
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // IDバリデーション
    if (!id || typeof id !== 'string') {
      return createErrorResponse({
        message: '無効なIDです',
        status: 400,
      });
    }

    // 英数字のみ許可（セキュリティ対策）
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      return createErrorResponse({
        message: '無効なID形式です',
        status: 400,
      });
    }

    // ストレージからOGP画像を取得
    const kv = c.env.OGP_KV as KVNamespace;
    const r2 = c.env.OGP_IMAGES as R2Bucket;

    const result = await getOgpImage({ kv, r2, id });

    if (!result) {
      return createErrorResponse({
        message: '画像が見つかりません',
        status: 404,
      });
    }

    const { imageData } = result;

    // 画像データをResponseとして返却
    return new Response(imageData.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-OGP-ID': id,
        'X-OGP-Created': result.metadata.createdAt,
      },
    });
  } catch (error) {
    console.error('OGP画像配信エラー:', error);

    // エラータイプに応じた適切なレスポンス
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return createErrorResponse({
          message: '画像取得がタイムアウトしました',
          status: 408,
        });
      }

      if (error.message.includes('connection')) {
        return createErrorResponse({
          message: 'ストレージへの接続に失敗しました',
          status: 503,
        });
      }
    }

    // その他のエラー
    return createErrorResponse({
      message: '内部サーバーエラーが発生しました',
      status: 500,
    });
  }
});

/**
 * OGP画像メタデータ取得エンドポイント（デバッグ用）
 * GET /api/ogp/[id]/meta
 */
app.get('/:id/meta', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || !/^[a-zA-Z0-9]+$/.test(id)) {
      return c.json({ error: '無効なIDです' }, 400);
    }

    const kv = c.env.OGP_KV as KVNamespace;
    const r2 = c.env.OGP_IMAGES as R2Bucket;

    const result = await getOgpImage({ kv, r2, id });

    if (!result) {
      return c.json({ error: '画像が見つかりません' }, 404);
    }

    return c.json({
      success: true,
      metadata: result.metadata,
      imageUrl: `/api/ogp/${id}`,
    });
  } catch (error) {
    console.error('メタデータ取得エラー:', error);
    return c.json({ error: '内部サーバーエラー' }, 500);
  }
});

/**
 * CORS対応のOPTIONSハンドラー
 */
app.options('/:id', () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
});

/**
 * 無効なメソッドへの対応
 */
app.all('/:id', () => {
  return createErrorResponse({
    message: 'メソッドが許可されていません。GET のみサポートしています。',
    status: 405,
  });
});

export default app;
