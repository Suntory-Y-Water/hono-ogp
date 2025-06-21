/**
 * OGP作成フォーム画面
 * ユーザーがOGP画像を作成するためのメイン画面
 */

import { createRoute } from 'honox/factory';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { generateLightweightOgpImage } from '@/lib/ogp-generator';
import { saveOgpImage, generateOgpId } from '@/lib/cloudflare';
import { GRADIENT_PRESETS } from '@/lib/ogp-generator';

// フォームスキーマ定義
const ogpFormSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'タイトルは必須です' })
    .max(200, { message: 'タイトルは200文字以内で入力してください' }),
  gradient: z.enum([
    'blue-to-purple',
    'pink-to-orange',
    'green-to-blue',
    'sunset',
    'ocean',
  ] as const),
});

// POSTハンドラー（フォーム送信処理）
export const POST = createRoute(
  zValidator('form', ogpFormSchema, (result, c) => {
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const message = encodeURIComponent(
        errors.title?.[0] || errors.gradient?.[0] || '入力内容に誤りがあります',
      );
      return c.redirect(`/?error=${message}`, 303);
    }
  }),
  async (c) => {
    try {
      const { title, gradient } = c.req.valid('form');

      // OGP画像生成
      const id = generateOgpId();
      const imageBuffer = await generateLightweightOgpImage({
        title,
        gradient,
      });

      // ストレージに保存
      await saveOgpImage({
        kv: c.env.OGP_KV,
        r2: c.env.OGP_IMAGES,
        id,
        ogpParams: { title, gradient },
        imageBuffer,
      });

      // 結果画面にリダイレクト
      return c.redirect(`/result?id=${id}`, 302);
    } catch (error) {
      console.error('OGP画像生成エラー:', error);
      const message = encodeURIComponent(
        '画像生成に失敗しました。もう一度お試しください。',
      );
      return c.redirect(`/?error=${message}`, 303);
    }
  },
);

export default createRoute((c) => {
  const error = c.req.query('error');

  return c.render(
    <div class='min-h-screen bg-gray-50'>
      {/* ヘッダー */}
      <header class='bg-white shadow-sm border-b'>
        <div class='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div class='flex justify-between items-center h-16'>
            <div class='flex items-center'>
              <h1 class='text-xl font-semibold text-gray-900'>
                OGP画像ジェネレーター
              </h1>
            </div>
            <nav class='flex items-center space-x-4'>
              <a
                href='/'
                class='text-gray-600 hover:text-gray-900 transition-colors'
              >
                ホーム
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main class='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div class='max-w-4xl mx-auto'>
          {/* ページタイトル */}
          <div class='text-center mb-8'>
            <h2 class='text-3xl font-bold text-gray-900 mb-4'>OGP画像を作成</h2>
            <p class='text-lg text-gray-600 max-w-2xl mx-auto'>
              記事やWebページ用のOGP画像を簡単に作成できます。
              タイトルを入力し、お好みのグラデーションを選択してください。
            </p>
          </div>

          {/* フォームセクション */}
          <div class='bg-white rounded-xl shadow-sm border p-6 lg:p-8'>
            <div class='w-full max-w-2xl mx-auto'>
              <form method='post' class='space-y-6'>
                {/* エラー表示 */}
                {error && (
                  <div class='bg-red-50 border border-red-200 rounded-lg p-4'>
                    <p class='text-red-800 text-sm'>
                      {decodeURIComponent(error)}
                    </p>
                  </div>
                )}

                {/* タイトル入力 */}
                <div class='space-y-2'>
                  <label
                    class='block text-sm font-medium text-gray-700'
                    for='title'
                  >
                    タイトル
                  </label>
                  <textarea
                    id='title'
                    name='title'
                    placeholder='OGP画像のタイトルを入力してください'
                    class='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <div class='flex justify-end text-sm'>
                    <span class='text-gray-500'>最大200文字</span>
                  </div>
                </div>

                {/* グラデーション選択 */}
                <fieldset class='space-y-3'>
                  <legend class='block text-sm font-medium text-gray-700'>
                    背景グラデーション
                  </legend>
                  <div class='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                    {Object.entries(GRADIENT_PRESETS).map(([key, gradient]) => (
                      <label
                        key={key}
                        class='relative h-20 rounded-lg border-2 cursor-pointer transition-all duration-200 border-gray-200 hover:border-gray-300 hover:shadow-md'
                        style={{ background: gradient }}
                        title={`グラデーション: ${key.replace('-', ' → ')}`}
                      >
                        <input
                          type='radio'
                          name='gradient'
                          value={key}
                          defaultChecked={key === 'blue-to-purple'}
                          class='sr-only'
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* 生成ボタン */}
                <button
                  type='submit'
                  class='w-full py-3 px-6 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200'
                >
                  OGP画像を生成
                </button>
              </form>

              {/* 使用方法説明 */}
              <div class='mt-8 p-4 bg-blue-50 rounded-lg'>
                <h3 class='text-sm font-medium text-blue-900 mb-2'>使用方法</h3>
                <ul class='text-sm text-blue-800 space-y-1'>
                  <li>• タイトルを入力してください（最大200文字）</li>
                  <li>• グラデーションを選択して背景を変更できます</li>
                  <li>
                    • 生成ボタンを押すと画像が作成され、結果画面が表示されます
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 機能説明セクション */}
          <div class='mt-12 grid md:grid-cols-2 gap-8'>
            <div class='bg-white rounded-lg shadow-sm border p-6'>
              <div class='flex items-center mb-4'>
                <div class='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4'>
                  <svg
                    class='w-6 h-6 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <title>カスタマイズアイコン</title>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5zM21 15a2 2 0 00-2-2h-4a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2z'
                    />
                  </svg>
                </div>
                <h3 class='text-lg font-semibold text-gray-900'>
                  簡単カスタマイズ
                </h3>
              </div>
              <p class='text-gray-600'>
                タイトルとグラデーションを選択するだけで、プロフェッショナルなOGP画像を作成できます。
              </p>
            </div>

            <div class='bg-white rounded-lg shadow-sm border p-6'>
              <div class='flex items-center mb-4'>
                <div class='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4'>
                  <svg
                    class='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <title>高速生成アイコン</title>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 10V3L4 14h7v7l9-11h-7z'
                    />
                  </svg>
                </div>
                <h3 class='text-lg font-semibold text-gray-900'>高速生成</h3>
              </div>
              <p class='text-gray-600'>
                Cloudflare
                Workersを活用した高速な画像生成で、数秒でOGP画像が完成します。
              </p>
            </div>

            <div class='bg-white rounded-lg shadow-sm border p-6'>
              <div class='flex items-center mb-4'>
                <div class='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4'>
                  <svg
                    class='w-6 h-6 text-purple-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <title>共有アイコン</title>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
                    />
                  </svg>
                </div>
                <h3 class='text-lg font-semibold text-gray-900'>簡単共有</h3>
              </div>
              <p class='text-gray-600'>
                生成された画像は専用URLで配信され、SNSやWebサイトで簡単に利用できます。
              </p>
            </div>

            <div class='bg-white rounded-lg shadow-sm border p-6'>
              <div class='flex items-center mb-4'>
                <div class='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4'>
                  <svg
                    class='w-6 h-6 text-orange-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <title>最適化アイコン</title>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <h3 class='text-lg font-semibold text-gray-900'>最適化済み</h3>
              </div>
              <p class='text-gray-600'>
                1200×630pxのOGP標準サイズで、TwitterやFacebookなどのSNSに最適化されています。
              </p>
            </div>
          </div>

          {/* フッター情報 */}
          <div class='mt-12 text-center'>
            <p class='text-sm text-gray-500'>
              このサービスは
              <a
                href='https://hono.dev'
                class='text-blue-600 hover:text-blue-700 ml-1 mr-1'
              >
                Hono
              </a>
              と
              <a
                href='https://workers.cloudflare.com'
                class='text-blue-600 hover:text-blue-700 ml-1'
              >
                Cloudflare Workers
              </a>
              で構築されています
            </p>
          </div>
        </div>
      </main>
    </div>,
    {
      title: 'OGP画像作成 | OGP画像ジェネレーター',
      description:
        'タイトルとグラデーションを選択するだけで、プロフェッショナルなOGP画像を簡単に作成できます。SNSやWebサイトに最適化された1200×630pxの画像を高速生成。',
    },
  );
});
