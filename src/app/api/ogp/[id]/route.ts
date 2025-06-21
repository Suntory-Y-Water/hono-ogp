/**
 * OGP画像配信APIエンドポイント
 * Cloudflareから画像を取得して配信
 */

import { NextRequest } from 'next/server';
import { getOGPImageResponse } from '@/lib/cloudflare';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return new Response('ID is required', { status: 400 });
    }

    // Cloudflareから画像を取得してレスポンスを返す
    return await getOGPImageResponse(id);
  } catch (error) {
    console.error('OGP image delivery failed:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
