import type { Metadata } from 'next';
import './globals.css';
import { fontNotoSansJp } from '@/assets/fonts';

export const metadata: Metadata = {
  title: 'OGP画像生成サービス',
  description:
    'タイトルとグラデーションを選択して、美しいOGP画像を生成しましょう',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' className={fontNotoSansJp.className}>
      <body>{children}</body>
    </html>
  );
}
