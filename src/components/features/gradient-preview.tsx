/**
 * グラデーションプレビューコンポーネント
 * OGPTemplateのレイアウトをベースにしたグラデーション表示専用プレビュー
 */

export interface GradientPreviewProps {
  gradient: {
    from: string;
    to: string;
  };
}

/**
 * グラデーションプレビュー
 * OGPTemplateのレイアウトから文字を除いた枠色のみの表示
 */
export function GradientPreview({ gradient }: GradientPreviewProps) {
  const backgroundStyle = `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})`;

  return (
    <div
      className='w-full aspect-[630/315] rounded-lg shadow-lg border border-gray-200 md:!p-6'
      style={{
        display: 'flex',
        padding: '12px',
        background: backgroundStyle,
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: 'column',
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: 6,
        }}
        className='md:!p-6'
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className='bg-gray-200 rounded md:!h-8'
            style={{
              height: '16px',
              width: '75%',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div
            className='bg-gray-200 rounded md:!h-6'
            style={{
              height: '12px',
              width: '40%',
            }}
          />
          <div
            className='bg-gray-200 rounded md:!h-6'
            style={{
              height: '12px',
              width: '30%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
