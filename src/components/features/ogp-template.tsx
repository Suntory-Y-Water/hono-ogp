/**
 * OGP画像生成用テンプレートコンポーネント
 */

export interface OGPTemplateProps {
  title: string;
  gradient?: {
    from: string;
    to: string;
  };
  icon?: string;
  author?: string;
}

/**
 * OGP画像テンプレート
 */
export function OGPTemplate({
  title,
  gradient = { from: '#9BD4FF', to: '#FFFA9B' },
  icon,
  author,
}: OGPTemplateProps) {
  const backgroundStyle = `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})`;

  return (
    <div
      style={{
        display: 'flex',
        padding: 48,
        height: '100%',
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
          color: '#000000d1',
          padding: 48,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 64, maxWidth: 1000, fontWeight: 600 }}>
            {title}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {author && (
            <div
              style={{
                fontSize: 48,
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {icon && (
                <img
                  src={icon}
                  width={60}
                  height={60}
                  alt='avatar'
                  style={{ borderRadius: 9999, marginRight: 24 }}
                />
              )}
              {author}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
