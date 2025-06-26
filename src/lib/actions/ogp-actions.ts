/**
 * OGP画像生成・操作用Server Actions
 * フォームデータを受け取り、画像生成からCloudflareへの保存まで実行
 */

'use server';

import { redirect } from 'next/navigation';
import { GRADIENT_PRESETS, type GradientPresetName } from '@/lib/constants';
import { saveOGPMetadata } from '@/lib/cloudflare';

/**
 * OGP画像生成Server Action
 * フォームからデータを受け取り、画像生成・アップロード・メタデータ保存を実行
 */
export async function generateOGPAction(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const gradientPreset = formData.get('gradient') as GradientPresetName;
  const icon = formData.get('icon') as string | null;
  const author = formData.get('author') as string | null;

  // バリデーション
  if (!title || title.trim().length === 0) {
    throw new Error('タイトルは必須です');
  }

  if (!gradientPreset || !GRADIENT_PRESETS[gradientPreset]) {
    throw new Error('有効なグラデーションを選択してください');
  }

  // アイコンURLのバリデーション（指定された場合のみ）
  if (icon && icon.trim().length > 0) {
    try {
      new URL(icon);
    } catch {
      throw new Error('有効なアイコンURLを入力してください');
    }
  }

  const gradient = GRADIENT_PRESETS[gradientPreset];

  // 一意のIDを生成
  const id = crypto.randomUUID();

  try {
    // KVにメタデータ保存（ImageResponseで動的生成するため画像ファイルは保存しない）
    await saveOGPMetadata({
      id,
      key: `ogp-${id}`, // R2は使わないがキーは必要
      title: title.trim(),
      gradient,
      url: `/api/ogp/${id}`,
      icon: icon?.trim() || undefined,
      author: author?.trim() || undefined,
    });
  } catch (error) {
    console.error('OGP generation action failed:', error);
    throw new Error('OGP画像の生成に失敗しました');
  }

  // Server Actionでのredirectは、try/catchブロックの外で呼び出す
  redirect(`/result?id=${id}`);
}
