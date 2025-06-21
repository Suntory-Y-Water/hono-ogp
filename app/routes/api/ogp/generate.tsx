/**
 * OGP画像生成API
 * リクエストを受けて動的にOGP画像を生成し、メタデータとファイルを保存する
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  generateLightweightOgpImage,
  ogpParamsToImageParams,
  isValidGradient,
} from '@/lib/ogp-generator';
import { saveOgpImage, generateOgpId, type OgpParams } from '@/lib/cloudflare';

const app = new Hono<{ Bindings: Env }>();

/**
 * リクエストボディのバリデーションスキーマ
 */
const generateRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以下で入力してください')
    .refine(
      (title) => title.trim().length > 0,
      'タイトルは空文字以外で入力してください',
    ),
  gradient: z
    .string()
    .min(1, 'グラデーションは必須です')
    .refine(
      (gradient) => isValidGradient(gradient),
      '無効なグラデーションです',
    ),
});

/**
 * レスポンス型定義
 */
interface GenerateResponse {
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
}

/**
 * エラーレスポンス生成ヘルパー
 */
function createErrorResponse(params: {
  message: string;
  code: string;
  status: number;
}): Response {
  const response: GenerateResponse = {
    success: false,
    error: {
      message: params.message,
      code: params.code,
    },
  };

  return new Response(JSON.stringify(response), {
    status: params.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * 成功レスポンス生成ヘルパー
 */
function createSuccessResponse(params: {
  id: string;
  title: string;
  gradient: string;
  imageUrl: string;
  createdAt: string;
}): Response {
  const response: GenerateResponse = {
    success: true,
    data: params,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * CORS対応のOPTIONSハンドラー
 */
app.options('/', () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
});

/**
 * OGP画像生成エンドポイント
 * POST /api/ogp/generate
 */
app.post('/', zValidator('json', generateRequestSchema), async (c) => {
  try {
    const startTime = Date.now();
    const { title, gradient } = c.req.valid('json');

    // ユニークIDの生成
    const id = generateOgpId();

    // OGPパラメータの準備
    const ogpParams: OgpParams = {
      title: title.trim(),
      gradient,
    };

    // 画像生成パラメータに変換
    const imageParams = ogpParamsToImageParams(ogpParams);

    // 軽量画像生成（Cloudflare Free版対応）
    const imageBuffer = await generateLightweightOgpImage(imageParams);

    // ストレージに保存
    const metadata = await saveOgpImage({
      kv: c.env.OGP_KV,
      r2: c.env.OGP_IMAGES,
      id,
      ogpParams,
      imageBuffer,
    });

    // 画像配信URL生成
    const imageUrl = `/api/ogp/${id}`;

    // パフォーマンス情報をログ出力
    const processingTime = Date.now() - startTime;
    console.log(
      `OGP画像生成完了: ID=${id}, 処理時間=${processingTime}ms, タイトル="${title}"`,
    );

    // Cloudflare Free版のCPU時間制限（10ms）チェック
    if (processingTime > 8000) {
      console.warn(
        `処理時間が長すぎます: ${processingTime}ms (推奨: 8000ms以下)`,
      );
    }

    return createSuccessResponse({
      id,
      title: metadata.title,
      gradient: metadata.gradient,
      imageUrl,
      createdAt: metadata.createdAt,
    });
  } catch (error) {
    console.error('OGP画像生成エラー:', error);

    // エラータイプに応じた適切なレスポンス
    if (error instanceof Error) {
      if (error.message.includes('WASM初期化エラー')) {
        return createErrorResponse({
          message: '画像生成システムの初期化に失敗しました',
          code: 'WASM_INIT_ERROR',
          status: 500,
        });
      }

      if (error.message.includes('フォント取得エラー')) {
        return createErrorResponse({
          message: 'フォントの読み込みに失敗しました',
          code: 'FONT_LOAD_ERROR',
          status: 500,
        });
      }

      if (error.message.includes('OGP画像生成エラー')) {
        return createErrorResponse({
          message: '画像の生成に失敗しました',
          code: 'IMAGE_GENERATION_ERROR',
          status: 500,
        });
      }

      if (
        error.message.includes('timeout') ||
        error.message.includes('CPU time limit')
      ) {
        return createErrorResponse({
          message: '処理時間の制限を超過しました',
          code: 'TIMEOUT_ERROR',
          status: 408,
        });
      }
    }

    // その他のエラー
    return createErrorResponse({
      message: '内部サーバーエラーが発生しました',
      code: 'INTERNAL_ERROR',
      status: 500,
    });
  }
});

/**
 * ヘルスチェックエンドポイント
 * GET /api/ogp/generate
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'OGP Image Generator API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 無効なメソッドへの対応
 */
app.all('/', () => {
  return createErrorResponse({
    message:
      'メソッドが許可されていません。POST または GET のみサポートしています。',
    code: 'METHOD_NOT_ALLOWED',
    status: 405,
  });
});

export default app;
