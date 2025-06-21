/**
 * OGP画像生成・操作用Server Actions
 * フォームデータを受け取り、画像生成からCloudflareへの保存まで実行
 */

'use server';

import {
  generateOGPImagePng,
  validateOGPOptions,
  GRADIENT_PRESETS,
} from '@/lib/ogp';
import { uploadOGPImage, saveOGPMetadata } from '@/lib/cloudflare';
import type { GradientPresetName } from '@/lib/ogp';

/**
 * OGP画像生成アクションの結果型
 */
export interface OGPGenerationResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}

/**
 * 一意のOGP IDを生成
 */
function generateOGPId(): string {
  return crypto.randomUUID();
}

/**
 * OGP画像生成Server Action
 * フォームからデータを受け取り、画像生成・アップロード・メタデータ保存を実行
 */
export async function generateOGPAction(
  formData: FormData,
): Promise<OGPGenerationResult> {
  try {
    const title = formData.get('title') as string;
    const gradientPreset = formData.get('gradient') as GradientPresetName;

    // バリデーション
    if (!title || title.trim().length === 0) {
      return {
        success: false,
        error: 'タイトルは必須です',
      };
    }

    if (!gradientPreset || !GRADIENT_PRESETS[gradientPreset]) {
      return {
        success: false,
        error: '有効なグラデーションを選択してください',
      };
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
      return {
        success: false,
        error: 'OGPオプションが無効です',
      };
    }

    // OGP画像生成
    const imageBuffer = await generateOGPImagePng(ogpOptions);

    // 一意のIDを生成
    const id = generateOGPId();

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

    return {
      success: true,
      id,
      url: `/result?id=${id}`,
    };
  } catch (error) {
    console.error('OGP generation action failed:', error);
    return {
      success: false,
      error: 'OGP画像の生成に失敗しました',
    };
  }
}
