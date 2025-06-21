/**
 * OGP画像生成フォームコンポーネント
 * タイトル入力、グラデーション選択、プレビュー機能を統合
 */

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GRADIENT_PRESETS, type GradientPresetName } from '@/lib/constants';
import { generateOGPAction } from '@/lib/actions/ogp-actions';
import { OGPPreview } from './ogp-preview';

const formSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内で入力してください'),
  gradient: z
    .string()
    .refine(
      (val) => val in GRADIENT_PRESETS,
      '有効なグラデーションを選択してください',
    ) as z.ZodType<GradientPresetName>,
});

type FormData = z.infer<typeof formSchema>;

export function OGPCreationForm() {
  const [isPending, startTransition] = useTransition();
  const [previewData, setPreviewData] = useState<FormData | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    id?: string;
    url?: string;
    error?: string;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      gradient: 'ocean',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('gradient', data.gradient);

      const response = await generateOGPAction(formData);
      setResult(response);

      if (response.success && response.url) {
        // 結果画面にリダイレクト
        window.location.href = response.url;
      }
    });
  });

  const handlePreviewUpdate = () => {
    const currentValues = form.getValues();
    if (currentValues.title && currentValues.gradient) {
      setPreviewData(currentValues);
    }
  };

  const gradientOptions: { value: GradientPresetName; label: string }[] = [
    { value: 'sunset', label: 'サンセット' },
    { value: 'ocean', label: 'オーシャン' },
    { value: 'forest', label: 'フォレスト' },
    { value: 'purple', label: 'パープル' },
    { value: 'fire', label: 'ファイア' },
  ];

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
      {/* フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>OGP画像設定</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* タイトル入力 */}
            <div className='space-y-2'>
              <Label htmlFor='title'>タイトル</Label>
              <Input
                id='title'
                placeholder='OGP画像のタイトルを入力してください'
                {...form.register('title')}
                onChange={(e) => {
                  form.setValue('title', e.target.value);
                  handlePreviewUpdate();
                }}
              />
              {form.formState.errors.title && (
                <p className='text-sm text-red-600'>
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* グラデーション選択 */}
            <div className='space-y-2'>
              <Label htmlFor='gradient'>グラデーション</Label>
              <Select
                value={form.watch('gradient')}
                onValueChange={(value: GradientPresetName) => {
                  form.setValue('gradient', value);
                  handlePreviewUpdate();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='グラデーションを選択' />
                </SelectTrigger>
                <SelectContent>
                  {gradientOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className='flex items-center space-x-2'>
                        <div
                          className='w-4 h-4 rounded-full'
                          style={{
                            background: `linear-gradient(135deg, ${GRADIENT_PRESETS[option.value].from}, ${GRADIENT_PRESETS[option.value].to})`,
                          }}
                        />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.gradient && (
                <p className='text-sm text-red-600'>
                  {form.formState.errors.gradient.message}
                </p>
              )}
            </div>

            {/* エラー表示 */}
            {result?.error && (
              <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
                <p className='text-red-800'>{result.error}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <Button
              type='submit'
              disabled={
                isPending ||
                !form.watch('title')?.trim() ||
                !form.watch('gradient')
              }
              className='w-full'
            >
              {isPending ? 'OGP画像を生成中...' : 'OGP画像を生成'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* プレビュー */}
      <Card>
        <CardHeader>
          <CardTitle>プレビュー</CardTitle>
        </CardHeader>
        <CardContent>
          {previewData ? (
            <OGPPreview
              title={previewData.title}
              gradient={GRADIENT_PRESETS[previewData.gradient]}
            />
          ) : (
            <div className='aspect-[1200/630] bg-gray-100 rounded-lg flex items-center justify-center'>
              <p className='text-gray-500'>
                タイトルを入力するとプレビューが表示されます
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
