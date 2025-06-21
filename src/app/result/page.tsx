/**
 * OGP画像生成結果表示ページ
 * 生成されたOGP画像とURLの表示、コピー機能
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getOGPMetadata, OGPMetadata } from '@/lib/cloudflare';
import { ResultDisplay } from '@/components/features/result-display';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface ResultPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const { id } = await searchParams;

  const { env } = getCloudflareContext();

  if (!id) {
    redirect('/');
  }

  let metadata: OGPMetadata | null = null;
  let error: string | null = null;

  try {
    metadata = await getOGPMetadata(id);
    if (!metadata) {
      error = 'OGP画像が見つかりませんでした';
    }
  } catch (err) {
    error = 'データの取得に失敗しました';
    console.error('Failed to fetch metadata:', err);
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12'>
      <div className='container mx-auto px-4'>
        <div className='max-w-4xl mx-auto'>
          {/* ヘッダー */}
          <div className='text-center mb-8'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              OGP画像が生成されました！
            </h1>
            <p className='text-xl text-gray-600'>
              以下のURLを使用してOGP画像を表示できます
            </p>
          </div>

          {/* 結果表示 */}
          {error || !metadata ? (
            <Card>
              <CardContent className='p-8'>
                <div className='text-center'>
                  <p className='text-red-600 mb-4'>{error}</p>
                  <Link href='/'>
                    <Button>新しいOGP画像を作成</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ResultDisplay metadata={metadata} endPoint={env.END_POINT} />
          )}
        </div>
      </div>
    </div>
  );
}
