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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { GRADIENT_PRESETS, type GradientPresetName } from '@/lib/constants';
import { generateOGPAction } from '@/lib/actions/ogp-actions';
import { GradientPreview } from './gradient-preview';

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
  customGradientFrom: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      '有効なカラーコード（#FFFFFF形式）を入力してください',
    )
    .optional(),
  customGradientTo: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      '有効なカラーコード（#FFFFFF形式）を入力してください',
    )
    .optional(),
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
  companyLogo: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  companyLogoFile: z
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
  const [logoMode, setLogoMode] = useState<'url' | 'upload'>('url');
  const [uploadedLogoFile, setUploadedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [gradientMode, setGradientMode] = useState<'preset' | 'custom'>(
    'preset',
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      gradient: 'ocean',
      customGradientFrom: '#667eea',
      customGradientTo: '#764ba2',
      icon: '',
      author: '',
      iconFile: undefined,
      companyLogo: '',
      companyLogoFile: undefined,
    },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      // エラー状態をリセット
      setResult(null);

      try {
        const formData = new FormData();

        // 必須フィールド
        formData.append('title', data.title);
        if (gradientMode === 'preset') {
          formData.append('gradient', data.gradient);
        } else {
          formData.append(
            'customGradientFrom',
            data.customGradientFrom || '#667eea',
          );
          formData.append(
            'customGradientTo',
            data.customGradientTo || '#764ba2',
          );
        }
        formData.append('icon', data.icon || '');
        formData.append('author', data.author || '');
        formData.append('companyLogo', data.companyLogo || '');

        // ファイル（存在する場合のみ）
        if (uploadedFile) {
          formData.append('iconFile', uploadedFile);
        }
        if (uploadedLogoFile) {
          formData.append('companyLogoFile', uploadedLogoFile);
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
  }

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

  function handleLogoFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedLogoFile(file);
      form.setValue('companyLogoFile', file);

      // プレビュー用のURLを生成
      const url = URL.createObjectURL(file);
      setLogoPreviewUrl(url);
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

  function handleLogoPaste(event: React.ClipboardEvent) {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setUploadedLogoFile(file);
          form.setValue('companyLogoFile', file);

          // プレビュー用のURLを生成
          const url = URL.createObjectURL(file);
          setLogoPreviewUrl(url);

          // アップロードモードに切り替え
          setLogoMode('upload');
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

  // 現在選択されているグラデーション値を取得
  const currentGradient =
    gradientMode === 'preset'
      ? GRADIENT_PRESETS[form.watch('gradient') as GradientPresetName]
      : {
          from: form.watch('customGradientFrom') || '#667eea',
          to: form.watch('customGradientTo') || '#764ba2',
        };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OGP画像設定</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* タイトル入力 */}
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='OGP画像のタイトルを入力してください'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* グラデーション選択 */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-sm leading-none font-medium select-none'>
                グラデーション
              </div>
              <Tabs
                value={gradientMode}
                onValueChange={(value) =>
                  setGradientMode(value as 'preset' | 'custom')
                }
              >
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='preset'>プリセット</TabsTrigger>
                  <TabsTrigger value='custom'>カスタム</TabsTrigger>
                </TabsList>

                <TabsContent value='preset' className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='gradient'
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='グラデーションを選択' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gradientOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value='custom' className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='customGradientFrom'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>開始色</FormLabel>
                          <FormControl>
                            <div className='flex items-center space-x-2'>
                              <input
                                type='color'
                                {...field}
                                className='w-12 h-10 border border-gray-300 rounded cursor-pointer'
                              />
                              <Input
                                type='text'
                                placeholder='#667eea'
                                {...field}
                                className='flex-1'
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='customGradientTo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>終了色</FormLabel>
                          <FormControl>
                            <div className='flex items-center space-x-2'>
                              <input
                                type='color'
                                {...field}
                                className='w-12 h-10 border border-gray-300 rounded cursor-pointer'
                              />
                              <Input
                                type='text'
                                placeholder='#764ba2'
                                {...field}
                                className='flex-1'
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* アイコン設定 */}
            <div className='space-y-2'>
              <FormLabel>アイコン設定（任意）</FormLabel>
              <Tabs
                value={iconMode}
                onValueChange={(value) =>
                  setIconMode(value as 'url' | 'upload')
                }
              >
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='url'>URLを入力</TabsTrigger>
                  <TabsTrigger value='upload'>画像をアップロード</TabsTrigger>
                </TabsList>

                <TabsContent value='url' className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='icon'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type='url'
                            placeholder='https://example.com/avatar.jpg'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value='upload' className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='iconFile'
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <div
                            className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors'
                            onPaste={handlePaste}
                          >
                            <input
                              type='file'
                              accept='image/*'
                              onChange={handleFileUpload}
                              className='hidden'
                              id='iconFile'
                            />
                            <label
                              htmlFor='iconFile'
                              className='cursor-pointer'
                            >
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </TabsContent>
              </Tabs>
            </div>

            {/* 著者名入力 */}
            <FormField
              control={form.control}
              name='author'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>著者名（任意）</FormLabel>
                  <FormControl>
                    <Input placeholder='著者名を入力してください' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 企業ロゴ設定 */}
            <div className='space-y-2'>
              <FormLabel>企業ロゴ設定（任意）</FormLabel>
              <Tabs
                value={logoMode}
                onValueChange={(value) =>
                  setLogoMode(value as 'url' | 'upload')
                }
              >
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='url'>URLを入力</TabsTrigger>
                  <TabsTrigger value='upload'>画像をアップロード</TabsTrigger>
                </TabsList>

                <TabsContent value='url' className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='companyLogo'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type='url'
                            placeholder='https://example.com/logo.png'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value='upload' className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='companyLogoFile'
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <div
                            className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors'
                            onPaste={handleLogoPaste}
                          >
                            <input
                              type='file'
                              accept='image/*'
                              onChange={handleLogoFileUpload}
                              className='hidden'
                              id='companyLogoFile'
                            />
                            <label
                              htmlFor='companyLogoFile'
                              className='cursor-pointer'
                            >
                              <div className='space-y-2'>
                                <div className='text-gray-600'>
                                  <p>
                                    企業ロゴをドラッグ＆ドロップ、クリックして選択、またはCtrl+Vで貼り付け
                                  </p>
                                  <p className='text-sm'>
                                    JPEG, PNG, GIF, WebP (最大1MB)
                                  </p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {logoPreviewUrl && (
                    <div className='mt-4'>
                      <p className='text-sm text-gray-600 mb-2'>プレビュー:</p>
                      <img
                        src={logoPreviewUrl}
                        alt='企業ロゴプレビュー'
                        className='max-w-32 max-h-32 object-contain rounded-lg border'
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
        </Form>

        {/* グラデーションプレビュー */}
        <div>
          <h3 className='leading-none font-semibold text-gray-800 mb-4'>
            グラデーションプレビュー
          </h3>
          <GradientPreview gradient={currentGradient} />
        </div>

        {/* サンプル画像部分 */}
        <div>
          <h3 className='leading-none font-semibold text-gray-800 mb-4'>
            生成イメージサンプル
          </h3>
          <div>
            <img
              src='/og-sample-image.png'
              alt='生成時のサンプル画像'
              className='w-full rounded-lg shadow-lg border border-gray-200'
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
