import { Noto_Sans_JP } from 'next/font/google';

export const fontNotoSansJp = Noto_Sans_JP({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: true,
});
