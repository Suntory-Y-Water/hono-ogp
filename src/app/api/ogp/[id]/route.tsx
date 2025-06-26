/**
 * OGP画像生成APIエンドポイント
 * ImageResponseを使用してPNG画像を動的生成
 */

import { ImageResponse } from 'next/og';
import { getOGPMetadata } from '@/lib/cloudflare';
import { OGPTemplate } from '@/components/features/ogp-template';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // KVからメタデータを取得
    const metadata = await getOGPMetadata(id);

    if (!metadata) {
      return new Response('OGP image not found', { status: 404 });
    }

    return new ImageResponse(
      <OGPTemplate
        title={metadata.title}
        gradient={metadata.gradient}
        icon={metadata.icon}
        author={metadata.author}
      />,
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error('OGP image generation failed:', error);

    // エラー時のフォールバック画像
    return new ImageResponse(
      <OGPTemplate
        title='OGP画像生成エラー'
        gradient={{ from: '#667eea', to: '#764ba2' }}
      />,
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
