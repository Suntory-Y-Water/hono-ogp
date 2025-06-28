/**
 * OGP画像生成結果表示コンポーネント
 * 生成結果、URLコピー、メタデータ表示機能
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CopyButton } from './copy-button';
import { SaveImageButton } from './save-image-button';
import type { OGPMetadata } from '@/lib/cloudflare';

type ResultDisplayProps = {
  metadata: OGPMetadata;
  endPoint: string;
};

export function ResultDisplay({ metadata, endPoint }: ResultDisplayProps) {
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex justify-center'>
            <img
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
            <div className='relative mt-1'>
              <Textarea
                id='image-url'
                value={imageUrl}
                readOnly
                rows={2}
                className='pr-12'
              />
              <div className='absolute right-2 top-2'>
                <CopyButton text={imageUrl} />
              </div>
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
            <div className='relative mt-1'>
              <Textarea
                id='meta-tags'
                value={ogpMetaTags}
                readOnly
                rows={6}
                className='pr-12 font-mono text-sm'
              />
              <div className='absolute right-2 top-2'>
                <CopyButton text={ogpMetaTags} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクション */}
      <div className='flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
        <Link href='/'>
          <Button size='lg' className='cursor-pointer w-full sm:w-auto'>
            新しいOGP画像を作成する
          </Button>
        </Link>
        <a href={imageUrl} target='_blank' rel='noopener noreferrer'>
          <Button
            variant='outline'
            size='lg'
            className='cursor-pointer w-full sm:w-auto'
          >
            画像を新しいタブで開く
          </Button>
        </a>
        <SaveImageButton
          imageUrl={imageUrl}
          filename={`ogp-${metadata.id}.png`}
          variant='outline'
          size='lg'
          className='cursor-pointer w-full sm:w-auto'
        >
          画像を保存する
        </SaveImageButton>
      </div>
    </div>
  );
}
