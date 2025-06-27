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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GRADIENT_PRESETS, type GradientPresetName } from '@/lib/constants';
import { generateOGPAction } from '@/lib/actions/ogp-actions';

const formSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(50, 'タイトルは50文字以内で入力してください'),
  gradient: z
    .string()
    .refine(
      (val) => val in GRADIENT_PRESETS,
      '有効なグラデーションを選択してください',
    ) as z.ZodType<GradientPresetName>,
  icon: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  author: z.string().max(40, '著者名は40文字以内で入力してください').optional(),
  iconFile: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= 1024 * 1024,
      '画像ファイルは1MB以下にしてください',
    )
    .refine(
      (file) =>
        !file ||
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
          file.type,
        ),
      'JPEG、PNG、GIF、WebP形式のファイルを選択してください',
    ),
});

type FormData = z.infer<typeof formSchema>;

type GenerateResult = {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
};

type GradientOption = {
  value: GradientPresetName;
  label: string;
};

export function OGPCreationForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [iconMode, setIconMode] = useState<'url' | 'upload'>('url');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      gradient: 'ocean',
      icon: '',
      author: '',
      iconFile: undefined,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      // エラー状態をリセット
      setResult(null);

      try {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('gradient', data.gradient);
        if (iconMode === 'url' && data.icon) {
          formData.append('icon', data.icon);
        }
        if (iconMode === 'upload' && uploadedFile) {
          formData.append('iconFile', uploadedFile);
        }
        if (data.author) {
          formData.append('author', data.author);
        }

        await generateOGPAction(formData);
        // redirect()が呼ばれるため、ここには到達しない
      } catch (error) {
        // Next.jsのRedirectErrorはエラー表示しない
        if (
          error &&
          typeof error === 'object' &&
          'digest' in error &&
          typeof error.digest === 'string' &&
          error.digest.startsWith('NEXT_REDIRECT')
        ) {
          return;
        }

        setResult({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'OGP画像の生成に失敗しました',
        });
      }
    });
  });

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      form.setValue('iconFile', file);

      // プレビュー用のURLを生成
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  function handlePaste(event: React.ClipboardEvent) {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setUploadedFile(file);
          form.setValue('iconFile', file);

          // プレビュー用のURLを生成
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);

          // アップロードモードに切り替え
          setIconMode('upload');
        }
        break;
      }
    }
  }

  const gradientOptions: GradientOption[] = [
    { value: 'sunset', label: 'サンセット' },
    { value: 'ocean', label: 'オーシャン' },
    { value: 'forest', label: 'フォレスト' },
    { value: 'purple', label: 'パープル' },
    { value: 'fire', label: 'ファイア' },
  ];

  return (
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

          {/* アイコン設定 */}
          <div className='space-y-2'>
            <Label>アイコン設定（任意）</Label>
            <Tabs
              value={iconMode}
              onValueChange={(value) => setIconMode(value as 'url' | 'upload')}
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='url'>URLを入力</TabsTrigger>
                <TabsTrigger value='upload'>画像をアップロード</TabsTrigger>
              </TabsList>

              <TabsContent value='url' className='space-y-2'>
                <Input
                  id='icon'
                  type='url'
                  placeholder='https://example.com/avatar.jpg'
                  {...form.register('icon')}
                  onChange={(e) => {
                    form.setValue('icon', e.target.value);
                  }}
                />
                {form.formState.errors.icon && (
                  <p className='text-sm text-red-600'>
                    {form.formState.errors.icon.message}
                  </p>
                )}
              </TabsContent>

              <TabsContent value='upload' className='space-y-2'>
                <div
                  className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors'
                  onPaste={handlePaste}
                  // tabIndex={0}
                >
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleFileUpload}
                    className='hidden'
                    id='iconFile'
                  />
                  <label htmlFor='iconFile' className='cursor-pointer'>
                    <div className='space-y-2'>
                      <div className='text-gray-600'>
                        <p>
                          画像をドラッグ＆ドロップ、クリックして選択、またはCtrl+Vで貼り付け
                        </p>
                        <p className='text-sm'>
                          JPEG, PNG, GIF, WebP (最大1MB)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {previewUrl && (
                  <div className='mt-4'>
                    <p className='text-sm text-gray-600 mb-2'>プレビュー:</p>
                    <img
                      src={previewUrl}
                      alt='アップロード画像プレビュー'
                      className='max-w-32 max-h-32 object-cover rounded-lg border'
                    />
                  </div>
                )}

                {form.formState.errors.iconFile && (
                  <p className='text-sm text-red-600'>
                    {form.formState.errors.iconFile.message}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* 著者名入力 */}
          <div className='space-y-2'>
            <Label htmlFor='author'>著者名（任意）</Label>
            <Input
              id='author'
              placeholder='著者名を入力してください'
              {...form.register('author')}
              onChange={(e) => {
                form.setValue('author', e.target.value);
              }}
            />
            {form.formState.errors.author && (
              <p className='text-sm text-red-600'>
                {form.formState.errors.author.message}
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
  );
}
