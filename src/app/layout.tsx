import './globals.css';
import { fontNotoSansJp } from '@/assets/fonts';

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
