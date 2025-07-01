/**
 * OGP画像生成APIエンドポイント
 * ImageResponseを使用してPNG画像を動的生成
 */

import { ImageResponse } from 'next/og';
import { getOGPMetadata, getImageAsBase64 } from '@/lib/cloudflare';
import { OGPTemplate } from '@/components/features/ogp-template';
import { loadFont } from '@/lib/utils';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // フォントファイルを読み込み
    const fontData = await loadFont('/fonts/NotoSansJP-SemiBold.ttf');

    // KVからメタデータを取得
    const metadata = await getOGPMetadata(id);

    if (!metadata) {
      return new Response('OGP image not found', { status: 404 });
    }

    // アイコンがR2キーの場合はBase64に変換
    let iconSrc = metadata.icon;
    if (
      iconSrc &&
      !iconSrc.startsWith('http') &&
      !iconSrc.startsWith('data:')
    ) {
      // R2キーの場合
      const base64Image = await getImageAsBase64(iconSrc);
      iconSrc = base64Image || undefined;
    }

    // 企業ロゴがR2キーの場合はBase64に変換
    let companyLogoSrc = metadata.companyLogo;
    if (
      companyLogoSrc &&
      !companyLogoSrc.startsWith('http') &&
      !companyLogoSrc.startsWith('data:')
    ) {
      // R2キーの場合
      const base64Image = await getImageAsBase64(companyLogoSrc);
      companyLogoSrc = base64Image || undefined;
    }

    return new ImageResponse(
      <OGPTemplate
        title={metadata.title}
        gradient={metadata.gradient}
        icon={iconSrc}
        author={metadata.author}
        companyLogo={companyLogoSrc}
      />,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Noto Sans JP',
            data: fontData,
            weight: 600,
            style: 'normal',
          },
        ],
      },
    );
  } catch (_error) {
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
