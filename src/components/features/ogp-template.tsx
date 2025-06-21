/**
 * OGP画像生成用テンプレートコンポーネント
 * Phase 1仕様: タイトル + グラデーション背景のみ
 */

export interface OGPTemplateProps {
  title: string;
  gradient?: {
    from: string;
    to: string;
  };
}

/**
 * Phase 1 MVP用OGP画像テンプレート
 * タイトルとグラデーション背景のみのシンプルなデザイン
 */
export function OGPTemplate({ 
  title, 
  gradient = { from: '#667eea', to: '#764ba2' }
}: OGPTemplateProps) {
  const backgroundStyle = `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: backgroundStyle,
        padding: '60px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          lineHeight: '1.2',
          maxWidth: '90%',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {title}
      </div>
    </div>
  );
}

/**
 * エラー時のフォールバック用テンプレート
 */
export function OGPErrorTemplate({ siteName = 'OGP画像生成サービス' }: { siteName?: string }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        fontSize: '32px',
        color: '#333',
      }}
    >
      {siteName}
    </div>
  );
}