/**
 * OGP画像生成・操作用Server Actions
 * フォームデータを受け取り、画像生成からCloudflareへの保存まで実行
 */

'use server';

import { redirect } from 'next/navigation';
import { generateOGPImagePng, validateOGPOptions } from '@/lib/ogp-server';
import { GRADIENT_PRESETS, type GradientPresetName } from '@/lib/constants';
import { uploadOGPImage, saveOGPMetadata } from '@/lib/cloudflare';

/**
 * OGP画像生成Server Action
 * フォームからデータを受け取り、画像生成・アップロード・メタデータ保存を実行
 */
export async function generateOGPAction(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const gradientPreset = formData.get('gradient') as GradientPresetName;

  // バリデーション
  if (!title || title.trim().length === 0) {
    throw new Error('タイトルは必須です');
  }

  if (!gradientPreset || !GRADIENT_PRESETS[gradientPreset]) {
    throw new Error('有効なグラデーションを選択してください');
  }

  const gradient = GRADIENT_PRESETS[gradientPreset];
  const ogpOptions = {
    title: title.trim(),
    gradient,
    width: 1200,
    height: 630,
  };

  // 追加バリデーション
  if (!validateOGPOptions(ogpOptions)) {
    throw new Error('OGPオプションが無効です');
  }

  // 一意のIDを生成（try/catchの外で定義）
  const id = crypto.randomUUID();

  try {
    // OGP画像生成
    const imageBuffer = await generateOGPImagePng(ogpOptions);

    // R2にアップロード
    const key = await uploadOGPImage({
      imageData: imageBuffer,
      id,
      title: ogpOptions.title,
    });

    // KVにメタデータ保存
    await saveOGPMetadata({
      id,
      key,
      title: ogpOptions.title,
      gradient,
      url: `/api/ogp/${id}`,
    });
  } catch (error) {
    console.error('OGP generation action failed:', error);
    throw new Error('OGP画像の生成に失敗しました');
  }

  // Server Actionでのredirectは、try/catchブロックの外で呼び出す
  redirect(`/result?id=${id}`);
}
