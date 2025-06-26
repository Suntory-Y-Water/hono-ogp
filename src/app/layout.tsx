import type { Metadata } from 'next';
import './globals.css';
import { fontNotoSansJp } from '@/assets/fonts';
import { getBaseUrl } from '@/lib/utils';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'OGP Image Generator',
  description:
    'タイトルとグラデーションを選択して、美しいOGP画像を生成しましょう',
  openGraph: {
    title: 'OGP Image Generator',
    description:
      'タイトルとグラデーションを選択して、美しいOGP画像を生成しましょう',
    url: baseUrl,
    siteName: 'OGP Image Generator',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'OGP Image Generator',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OGP Image Generator',
    description:
      'タイトルとグラデーションを選択して、美しいOGP画像を生成しましょう',
    images: [`${baseUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: ['OGP', '画像生成', 'SNS', 'ソーシャルメディア', 'OpenGraph'],
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
