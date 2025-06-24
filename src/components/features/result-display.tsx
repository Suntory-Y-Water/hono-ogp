/**
 * OGP画像生成結果表示コンポーネント
 * 生成結果、URLコピー、メタデータ表示機能
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { OGPMetadata } from '@/lib/cloudflare';

interface ResultDisplayProps {
  metadata: OGPMetadata;
  endPoint: string;
}

export function ResultDisplay({ metadata, endPoint }: ResultDisplayProps) {
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopyStatus({ ...copyStatus, [key]: true });
    setTimeout(() => {
      setCopyStatus({ ...copyStatus, [key]: false });
    }, 2000);
  };

  const imageUrl = `${endPoint}/api/ogp/${metadata.id}`;
  const ogpMetaTags = `<meta property="og:image" content="${imageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:title" content="${metadata.title}" />
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:image" content="${imageUrl}" />`;

  return (
    <div className='space-y-8'>
      {/* 生成された画像 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            生成されたOGP画像
            <Badge variant='secondary'>
              {new Date(metadata.createdAt).toLocaleDateString('ja-JP')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex justify-center'>
            <Image
              src={imageUrl}
              alt={`OGP画像: ${metadata.title}`}
              width={1200}
              height={630}
              className='max-w-full h-auto border rounded-lg shadow-sm'
            />
          </div>
        </CardContent>
      </Card>

      {/* URL情報 */}
      <Card>
        <CardHeader>
          <CardTitle>画像URL</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='image-url'>画像のダイレクトURL</Label>
            <div className='flex space-x-2 mt-1'>
              <Textarea
                id='image-url'
                value={imageUrl}
                readOnly
                rows={2}
                className='flex-1'
              />
              <Button
                onClick={() => handleCopy(imageUrl, 'imageUrl')}
                variant='outline'
                className='self-start'
              >
                {copyStatus.imageUrl ? 'コピー済み' : 'コピー'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OGPメタタグ */}
      <Card>
        <CardHeader>
          <CardTitle>HTMLメタタグ</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='meta-tags'>
              以下のメタタグをHTMLのheadセクションに追加してください
            </Label>
            <div className='flex space-x-2 mt-1'>
              <Textarea
                id='meta-tags'
                value={ogpMetaTags}
                readOnly
                rows={6}
                className='flex-1 font-mono text-sm'
              />
              <Button
                onClick={() => handleCopy(ogpMetaTags, 'metaTags')}
                variant='outline'
                className='self-start'
              >
                {copyStatus.metaTags ? 'コピー済み' : 'コピー'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクション */}
      <div className='flex justify-center space-x-4'>
        <Link href='/'>
          <Button size='lg'>新しいOGP画像を作成</Button>
        </Link>
        <Button
          variant='outline'
          size='lg'
          onClick={() => window.open(imageUrl, '_blank')}
        >
          画像を新しいタブで開く
        </Button>
      </div>
    </div>
  );
}
