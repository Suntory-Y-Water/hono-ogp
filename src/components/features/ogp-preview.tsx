/**
 * OGP画像プレビューコンポーネント
 * リアルタイムプレビュー表示用
 */

'use client';

interface OGPPreviewProps {
  title: string;
  gradient: {
    from: string;
    to: string;
  };
}

export function OGPPreview({ title, gradient }: OGPPreviewProps) {
  const backgroundStyle = `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`;

  return (
    <div className='aspect-[1200/630] rounded-lg overflow-hidden shadow-lg'>
      <div
        className='w-full h-full flex items-center justify-center p-8'
        style={{ background: backgroundStyle }}
      >
        <div className='text-center'>
          <h2
            className='text-white font-bold text-3xl md:text-4xl lg:text-5xl leading-tight max-w-4xl'
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              wordBreak: 'break-word',
              hyphens: 'auto',
            }}
          >
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}
