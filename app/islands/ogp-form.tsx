/**
 * OGP設定フォームコンポーネント
 * タイトル入力とグラデーション選択機能を提供
 */

import { useState } from 'hono/jsx';
import { GRADIENT_PRESETS, type GradientType } from '../lib/ogp-generator';

export default function OgpForm() {
  const [title, setTitle] = useState('');
  const [selectedGradient, setSelectedGradient] =
    useState<GradientType>('blue-to-purple');
  const [titleError, setTitleError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  function validateTitle(value: string): string {
    if (!value.trim()) {
      return 'タイトルを入力してください';
    }
    if (value.length > 200) {
      return 'タイトルは200文字以内で入力してください';
    }
    return '';
  }

  function handleTitleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    setTitle(value);
    const error = validateTitle(value);
    setTitleError(error);
  }

  function handleGradientChange(gradient: GradientType) {
    setSelectedGradient(gradient);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    const error = validateTitle(title);
    if (error) {
      setTitleError(error);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ogp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          gradient: selectedGradient,
        }),
      });

      // APIがリダイレクトレスポンス(302)を返す場合の処理
      if (response.status === 302) {
        const location = response.headers.get('Location');
        if (location) {
          window.location.href = location;
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response
          .json<{ message?: string }>()
          .catch(() => ({ message: undefined }));
        throw new Error(errorData.message || '画像生成に失敗しました');
      }
    } catch (error) {
      console.error('OGP画像生成エラー:', error);
      alert(
        `画像生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      );
      setIsGenerating(false);
    }
  }

  return (
    <div class='w-full max-w-2xl mx-auto'>
      <form onSubmit={handleSubmit} class='space-y-6'>
        {/* タイトル入力 */}
        <div class='space-y-2'>
          <label class='block text-sm font-medium text-gray-700' for='title'>
            タイトル
          </label>
          <textarea
            id='title'
            value={title}
            onInput={handleTitleChange}
            placeholder='OGP画像のタイトルを入力してください'
            class={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              titleError ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={3}
            maxLength={200}
          />
          <div class='flex justify-between text-sm'>
            {titleError && <span class='text-red-600'>{titleError}</span>}
            <span class='text-gray-500 ml-auto'>{title.length}/200</span>
          </div>
        </div>

        {/* グラデーション選択 */}
        <div class='space-y-3'>
          <label
            class='block text-sm font-medium text-gray-700'
            for='gradient-selection'
          >
            背景グラデーション
          </label>
          <div
            class='grid grid-cols-2 sm:grid-cols-3 gap-3'
            id='gradient-selection'
          >
            {Object.entries(GRADIENT_PRESETS).map(([key, gradient]) => (
              <button
                key={key}
                type='button'
                onClick={() => handleGradientChange(key as GradientType)}
                class={`relative h-20 rounded-lg border-2 transition-all duration-200 ${
                  selectedGradient === key
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                style={{ background: gradient }}
                title={`グラデーション: ${key.replace('-', ' → ')}`}
              >
                {selectedGradient === key && (
                  <div class='absolute inset-0 flex items-center justify-center'>
                    <div class='w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm'>
                      <svg
                        class='w-4 h-4 text-blue-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                        aria-label='選択済み'
                      >
                        <title>選択済み</title>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p class='text-sm text-gray-600 capitalize'>
            選択中: {selectedGradient.replace('-', ' → ')}
          </p>
        </div>

        {/* 生成ボタン */}
        <button
          type='submit'
          disabled={isGenerating || !!titleError || !title.trim()}
          class={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
            isGenerating || !!titleError || !title.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md'
          }`}
          onClick={() =>
            console.log('ボタン状態:', {
              isGenerating,
              titleError,
              title: title.trim(),
              disabled: isGenerating || !!titleError || !title.trim(),
            })
          }
        >
          {isGenerating ? (
            <div class='flex items-center justify-center space-x-2'>
              <svg
                class='w-5 h-5 animate-spin'
                fill='none'
                viewBox='0 0 24 24'
                aria-label='読み込み中'
              >
                <title>読み込み中</title>
                <circle
                  class='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  class='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              <span>生成中...</span>
            </div>
          ) : (
            'OGP画像を生成'
          )}
        </button>
      </form>

      {/* 使用方法説明 */}
      <div class='mt-8 p-4 bg-blue-50 rounded-lg'>
        <h3 class='text-sm font-medium text-blue-900 mb-2'>使用方法</h3>
        <ul class='text-sm text-blue-800 space-y-1'>
          <li>• タイトルを入力すると自動でプレビューが表示されます</li>
          <li>• グラデーションを選択して背景を変更できます</li>
          <li>• 生成ボタンを押すと画像が作成され、配信URLが発行されます</li>
        </ul>
      </div>
    </div>
  );
}
