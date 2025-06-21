/**
 * 生成結果画面
 * OGP画像の生成結果と配信URLを表示
 */

import { createRoute } from 'honox/factory';
import { getOgpMetadata } from '../lib/cloudflare';

export default createRoute(async (c) => {
  const id = c.req.query('id');

  if (!id) {
    return c.redirect('/ogp', 302);
  }

  // メタデータを取得
  const metadata = await getOgpMetadata({ kv: c.env.OGP_KV, id });

  if (!metadata) {
    return c.render(
      <div class='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div class='text-center'>
          <h1 class='text-2xl font-bold text-gray-900 mb-4'>
            画像が見つかりません
          </h1>
          <p class='text-gray-600 mb-6'>
            指定されたIDの画像は存在しないか、削除された可能性があります。
          </p>
          <a
            href='/ogp'
            class='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            新しい画像を作成
          </a>
        </div>
      </div>,
      {
        title: '画像が見つかりません | OGP画像ジェネレーター',
      },
    );
  }

  const imageUrl = `/api/ogp/${id}`;
  const fullImageUrl = `${new URL(c.req.url).origin}${imageUrl}`;

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
                href='/ogp'
                class='text-gray-600 hover:text-gray-900 transition-colors'
              >
                新しい画像を作成
              </a>
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
          {/* 成功メッセージ */}
          <div class='bg-green-50 border border-green-200 rounded-lg p-4 mb-8'>
            <div class='flex items-center'>
              <svg
                class='w-5 h-5 text-green-500 mr-3'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <title>成功アイコン</title>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <p class='text-green-800 font-medium'>
                OGP画像が正常に生成されました！
              </p>
            </div>
          </div>

          {/* ページタイトル */}
          <div class='text-center mb-8'>
            <h2 class='text-3xl font-bold text-gray-900 mb-4'>生成結果</h2>
            <p class='text-lg text-gray-600'>
              画像のプレビューと配信URLを確認してください
            </p>
          </div>

          {/* 画像プレビュー */}
          <div class='bg-white rounded-xl shadow-sm border p-6 lg:p-8 mb-8'>
            <h3 class='text-xl font-semibold text-gray-900 mb-4'>プレビュー</h3>
            <div class='border rounded-lg p-4 bg-gray-50'>
              <img
                src={imageUrl}
                alt={`OGP画像: ${metadata.title}`}
                class='w-full max-w-2xl mx-auto rounded-lg shadow-sm'
                style='aspect-ratio: 1200/630'
              />
            </div>
            <div class='mt-4 text-sm text-gray-600'>
              <p>
                <strong>タイトル:</strong> {metadata.title}
              </p>
              <p>
                <strong>グラデーション:</strong>{' '}
                {metadata.gradient.replace('-', ' → ')}
              </p>
              <p>
                <strong>作成日時:</strong>{' '}
                {new Date(metadata.createdAt).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>

          {/* URL情報 */}
          <div class='bg-white rounded-xl shadow-sm border p-6 lg:p-8 mb-8'>
            <h3 class='text-xl font-semibold text-gray-900 mb-4'>配信URL</h3>
            <div class='space-y-4'>
              <div>
                <label
                  class='block text-sm font-medium text-gray-700 mb-2'
                  for='image-url'
                >
                  画像URL
                </label>
                <div class='flex items-center space-x-2'>
                  <input
                    type='text'
                    value={fullImageUrl}
                    readonly
                    class='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm'
                    id='image-url'
                  />
                  <button
                    type='button'
                    onclick={`navigator.clipboard.writeText('${fullImageUrl}').then(() => alert('URLをコピーしました！'))`}
                    class='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                  >
                    コピー
                  </button>
                </div>
              </div>

              <div>
                <label
                  class='block text-sm font-medium text-gray-700 mb-2'
                  for='og-meta'
                >
                  HTML用metaタグ
                </label>
                <div class='space-y-2'>
                  <div class='flex items-center space-x-2'>
                    <input
                      type='text'
                      value={`<meta property="og:image" content="${fullImageUrl}" />`}
                      readonly
                      class='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono'
                      id='og-meta'
                    />
                    <button
                      type='button'
                      onclick={`navigator.clipboard.writeText('<meta property="og:image" content="${fullImageUrl}" />').then(() => alert('metaタグをコピーしました！'))`}
                      class='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                    >
                      コピー
                    </button>
                  </div>
                  <div class='flex items-center space-x-2'>
                    <input
                      type='text'
                      value={`<meta name="twitter:image" content="${fullImageUrl}" />`}
                      readonly
                      class='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono'
                      id='twitter-meta'
                    />
                    <button
                      type='button'
                      onclick={`navigator.clipboard.writeText('<meta name="twitter:image" content="${fullImageUrl}" />').then(() => alert('Twitterメタタグをコピーしました！'))`}
                      class='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 使用方法 */}
          <div class='bg-blue-50 rounded-xl p-6 lg:p-8 mb-8'>
            <h3 class='text-lg font-semibold text-blue-900 mb-4'>使用方法</h3>
            <div class='space-y-3 text-sm text-blue-800'>
              <div class='flex items-start space-x-3'>
                <span class='flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold text-xs'>
                  1
                </span>
                <p>
                  <strong>HTMLに追加:</strong>{' '}
                  上記のmetaタグをHTMLの&lt;head&gt;セクションに追加してください。
                </p>
              </div>
              <div class='flex items-start space-x-3'>
                <span class='flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold text-xs'>
                  2
                </span>
                <p>
                  <strong>SNSでシェア:</strong>{' '}
                  URLをシェアすると、設定した画像が自動的に表示されます。
                </p>
              </div>
              <div class='flex items-start space-x-3'>
                <span class='flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold text-xs'>
                  3
                </span>
                <p>
                  <strong>画像サイズ:</strong>{' '}
                  1200×630pxでTwitter、Facebook、Linkedinなど主要SNSに対応しています。
                </p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div class='flex justify-center space-x-4'>
            <a
              href='/ogp'
              class='inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              <svg
                class='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <title>新規作成アイコン</title>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              新しい画像を作成
            </a>
            <button
              type='button'
              onclick={`window.open('${imageUrl}', '_blank')`}
              class='inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium'
            >
              <svg
                class='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <title>ダウンロードアイコン</title>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              画像を開く
            </button>
          </div>
        </div>
      </main>
    </div>,
    {
      title: `生成結果: ${metadata.title} | OGP画像ジェネレーター`,
      description: `OGP画像「${metadata.title}」の生成が完了しました。URLをコピーしてWebサイトやSNSでご利用ください。`,
    },
  );
});
