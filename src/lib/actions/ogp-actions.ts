/**
 * OGP画像生成・操作用Server Actions
 * フォームデータを受け取り、画像生成からCloudflareへの保存まで実行
 */

'use server';

import { redirect } from 'next/navigation';
import { GRADIENT_PRESETS, type GradientPresetName } from '@/lib/constants';
import { saveOGPMetadata, uploadImageToR2 } from '@/lib/cloudflare';

/**
 * OGP画像生成Server Action
 * フォームからデータを受け取り、画像生成・アップロード・メタデータ保存を実行
 */
export async function generateOGPAction(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const gradientPreset = formData.get('gradient') as GradientPresetName;
  const customGradientFrom = formData.get('customGradientFrom') as string | null;
  const customGradientTo = formData.get('customGradientTo') as string | null;
  const icon = formData.get('icon') as string | null;
  const iconFile = formData.get('iconFile') as File | null;
  const author = formData.get('author') as string | null;
  const companyLogo = formData.get('companyLogo') as string | null;
  const companyLogoFile = formData.get('companyLogoFile') as File | null;

  // バリデーション
  if (!title || title.trim().length === 0) {
    throw new Error('タイトルは必須です');
  }

  // グラデーションバリデーション（プリセットまたはカスタム）
  let gradient: { from: string; to: string };
  
  if (customGradientFrom && customGradientTo) {
    // カスタムグラデーションの場合
    if (!/^#[0-9A-Fa-f]{6}$/.test(customGradientFrom)) {
      throw new Error('有効な開始色カラーコード（#FFFFFF形式）を入力してください');
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(customGradientTo)) {
      throw new Error('有効な終了色カラーコード（#FFFFFF形式）を入力してください');
    }
    gradient = {
      from: customGradientFrom,
      to: customGradientTo
    };
  } else if (gradientPreset && GRADIENT_PRESETS[gradientPreset]) {
    // プリセットグラデーションの場合
    gradient = GRADIENT_PRESETS[gradientPreset];
  } else {
    throw new Error('有効なグラデーションを選択してください');
  }

  // アイコンの処理
  let iconUrl: string | undefined;

  if (iconFile && iconFile.size > 0) {
    // ファイルアップロードの場合
    if (iconFile.size > 1024 * 1024) {
      throw new Error('画像ファイルは1MB以下にしてください');
    }

    if (
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
        iconFile.type,
      )
    ) {
      throw new Error('JPEG、PNG、GIF、WebP形式のファイルを選択してください');
    }

    // R2にアップロード
    const r2Key = await uploadImageToR2(iconFile, 'icons');
    iconUrl = r2Key; // R2のキーを直接保存
  } else if (icon && icon.trim().length > 0) {
    // URLの場合
    try {
      new URL(icon);
      iconUrl = icon.trim();
    } catch {
      throw new Error('有効なアイコンURLを入力してください');
    }
  }

  // 企業ロゴの処理
  let companyLogoUrl: string | undefined;

  if (companyLogoFile && companyLogoFile.size > 0) {
    // ファイルアップロードの場合
    if (companyLogoFile.size > 1024 * 1024) {
      throw new Error('企業ロゴファイルは1MB以下にしてください');
    }

    if (
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
        companyLogoFile.type,
      )
    ) {
      throw new Error('JPEG、PNG、GIF、WebP形式のファイルを選択してください');
    }

    // R2にアップロード
    const r2Key = await uploadImageToR2(companyLogoFile, 'company-logos');
    companyLogoUrl = r2Key; // R2のキーを直接保存
  } else if (companyLogo && companyLogo.trim().length > 0) {
    // URLの場合
    try {
      new URL(companyLogo);
      companyLogoUrl = companyLogo.trim();
    } catch {
      throw new Error('有効な企業ロゴURLを入力してください');
    }
  }

  // gradientは上記でバリデーション済み

  // 一意のIDを生成
  const id = crypto.randomUUID();

  try {
    // KVにメタデータ保存
    await saveOGPMetadata({
      id,
      key: `ogp-${id}`,
      title: title.trim(),
      gradient,
      url: `/api/ogp/${id}`,
      icon: iconUrl,
      author: author?.trim() || undefined,
      companyLogo: companyLogoUrl,
    });
  } catch (error) {
    console.error('OGP generation action failed:', error);
    throw new Error('OGP画像の生成に失敗しました');
  }

  // Server Actionでのredirectは、try/catchブロックの外で呼び出す
  redirect(`/result?id=${id}`);
}
