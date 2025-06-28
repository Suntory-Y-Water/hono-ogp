/**
 * OGP Image Generator - メインページ
 * フォーム入力からOGP画像生成までの統合フロー
 */

import { OGPCreationForm } from '@/components/features/ogp-creation-form';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function generateMetadata() {
  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.END_POINT || 'http://localhost:3000';

  return {
    title: 'OGP Image Generator',
    description:
      'タイトルとグラデーションを選択して、美しいOGP画像を生成しましょう',
    openGraph: {
      title: 'OGP Image Generator',
      description:
        'タイトルとグラデーションを選択して、美しいOGP画像を生成しましょう',
      url: baseUrl,
      siteName: 'OGP Image Generator',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'OGP Image Generator',
        },
      ],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'OGP Image Generator',
      description:
        'タイトルとグラデーションを選択して、美しいOGP画像を生成しましょう',
      images: [`${baseUrl}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
    keywords: ['OGP', '画像生成', 'SNS', 'ソーシャルメディア', 'OpenGraph'],
  };
}

export default function Home() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12'>
      <div className='container mx-auto px-4'>
        <div className='max-w-4xl mx-auto'>
          {/* ヘッダー */}
          <div className='text-center mb-8'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              OGP Image Generator
            </h1>
            <p className='text-xl text-gray-600'>
              タイトルとグラデーションを選択して、美しいOGP画像を生成しましょう
            </p>
          </div>
          {/* メインコンテンツ */}
          <OGPCreationForm />
        </div>
      </div>
    </div>
  );
}
