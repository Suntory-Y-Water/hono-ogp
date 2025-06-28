import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cloudflare Workersでフォントファイルを読み込む
 * ASSETSバインディングを使用して静的アセットからフォントデータを取得
 */
export async function loadFont(fontPath: string): Promise<ArrayBuffer> {
  const { env } = getCloudflareContext();

  if (!env.ASSETS) {
    const response = await fetch(`http://localhost:3000${fontPath}`);
    return response.arrayBuffer();
  }

  const response = await env.ASSETS.fetch(
    new Request(`${env.END_POINT}${fontPath}`),
  );
  return response.arrayBuffer();
}
