/**
 * OGP画像生成サービス - メインページ
 * フォーム入力からOGP画像生成までの統合フロー
 */

import { OGPCreationForm } from '@/components/features/ogp-creation-form';

export default function Home() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12'>
      <div className='container mx-auto px-4'>
        <div className='max-w-4xl mx-auto'>
          {/* ヘッダー */}
          <div className='text-center mb-8'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              OGP画像生成サービス
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
