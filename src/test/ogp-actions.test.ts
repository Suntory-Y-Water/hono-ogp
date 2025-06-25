/**
 * OGP Actions テスト
 */

import { generateOGPAction } from '../lib/actions/ogp-actions';
import { saveOGPMetadata } from '../lib/cloudflare';
import { redirect } from 'next/navigation';

// モック設定
vi.mock('../lib/cloudflare', () => ({
  saveOGPMetadata: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// crypto.randomUUID のモック
const mockUUID = 'test-uuid-123';
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => mockUUID),
  },
});

describe('generateOGPAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('有効なタイトルとグラデーションで成功する', async () => {
      // Given: 有効なフォームデータ
      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('gradient', 'sunset');

      // When: アクションを実行
      await generateOGPAction(formData);

      // Then: 期待される処理が実行される
      expect(saveOGPMetadata).toHaveBeenCalledWith({
        id: mockUUID,
        key: `ogp-${mockUUID}`,
        title: 'Test Title',
        gradient: { from: '#ff7e5f', to: '#feb47b' },
        url: `/api/ogp/${mockUUID}`,
      });
      expect(redirect).toHaveBeenCalledWith(`/result?id=${mockUUID}`);
    });

    it('タイトルの前後空白を正しく処理する', async () => {
      // Given: 前後に空白があるタイトル
      const formData = new FormData();
      formData.append('title', '  Trimmed Title  ');
      formData.append('gradient', 'ocean');

      // When: アクションを実行
      await generateOGPAction(formData);

      // Then: 空白がトリムされて保存される
      expect(saveOGPMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Trimmed Title',
        }),
      );
    });

    it('すべてのグラデーションプリセットが正しく処理される', async () => {
      const presets = [
        { name: 'sunset', expected: { from: '#ff7e5f', to: '#feb47b' } },
        { name: 'ocean', expected: { from: '#667eea', to: '#764ba2' } },
        { name: 'forest', expected: { from: '#11998e', to: '#38ef7d' } },
        { name: 'purple', expected: { from: '#8360c3', to: '#2ebf91' } },
        { name: 'fire', expected: { from: '#ff416c', to: '#ff4b2b' } },
      ];

      for (const preset of presets) {
        // Given: プリセットごとのフォームデータ
        const formData = new FormData();
        formData.append('title', 'Test Title');
        formData.append('gradient', preset.name);

        // When: アクションを実行
        await generateOGPAction(formData);

        // Then: 正しいグラデーションが設定される
        expect(saveOGPMetadata).toHaveBeenCalledWith(
          expect.objectContaining({
            gradient: preset.expected,
          }),
        );

        vi.clearAllMocks();
      }
    });
  });

  describe('異常系 - バリデーションエラー', () => {
    it('タイトルが空文字の場合はエラーをスローする', async () => {
      // Given: 空文字のタイトル
      const formData = new FormData();
      formData.append('title', '');
      formData.append('gradient', 'sunset');

      // When & Then: エラーがスローされる
      await expect(generateOGPAction(formData)).rejects.toThrow(
        'タイトルは必須です',
      );
      expect(saveOGPMetadata).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('タイトルが空白のみの場合はエラーをスローする', async () => {
      // Given: 空白のみのタイトル
      const formData = new FormData();
      formData.append('title', '   ');
      formData.append('gradient', 'sunset');

      // When & Then: エラーがスローされる
      await expect(generateOGPAction(formData)).rejects.toThrow(
        'タイトルは必須です',
      );
    });

    it('タイトルがnullの場合はエラーをスローする', async () => {
      // Given: タイトルが設定されていないフォームデータ
      const formData = new FormData();
      formData.append('gradient', 'sunset');

      // When & Then: エラーがスローされる
      await expect(generateOGPAction(formData)).rejects.toThrow(
        'タイトルは必須です',
      );
    });

    it('グラデーションが無効な場合はエラーをスローする', async () => {
      // Given: 無効なグラデーション
      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('gradient', 'invalid-gradient');

      // When & Then: エラーがスローされる
      await expect(generateOGPAction(formData)).rejects.toThrow(
        '有効なグラデーションを選択してください',
      );
      expect(saveOGPMetadata).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('グラデーションがnullの場合はエラーをスローする', async () => {
      // Given: グラデーションが設定されていないフォームデータ
      const formData = new FormData();
      formData.append('title', 'Test Title');

      // When & Then: エラーがスローされる
      await expect(generateOGPAction(formData)).rejects.toThrow(
        '有効なグラデーションを選択してください',
      );
    });
  });

  describe('異常系 - 外部依存関係のエラー', () => {
    it('saveOGPMetadataが失敗した場合はエラーをスローする', async () => {
      // Given: saveOGPMetadataが失敗する状況
      const mockError = new Error('KV save failed');
      vi.mocked(saveOGPMetadata).mockRejectedValue(mockError);

      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('gradient', 'sunset');

      // When & Then: エラーがスローされる
      await expect(generateOGPAction(formData)).rejects.toThrow(
        'OGP画像の生成に失敗しました',
      );
      expect(redirect).not.toHaveBeenCalled();
    });

    it('saveOGPMetadataが失敗してもconsole.errorが呼ばれる', async () => {
      // Given: console.errorのスパイ
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockError = new Error('KV save failed');
      vi.mocked(saveOGPMetadata).mockRejectedValue(mockError);

      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('gradient', 'sunset');

      // When: アクションを実行（エラーを無視）
      try {
        await generateOGPAction(formData);
      } catch {
        // エラーは無視
      }

      // Then: エラーがログに記録される
      expect(consoleSpy).toHaveBeenCalledWith(
        'OGP generation action failed:',
        mockError,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('境界値テスト', () => {
    it('最小長のタイトル（1文字）で成功する', async () => {
      // Given: saveOGPMetadataが成功する状況とテストデータ
      vi.mocked(saveOGPMetadata).mockResolvedValue();
      const formData = new FormData();
      formData.append('title', 'A');
      formData.append('gradient', 'sunset');

      // When: アクションを実行
      await generateOGPAction(formData);

      // Then: 正常に処理される
      expect(saveOGPMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'A',
        }),
      );
    });

    it('非常に長いタイトルでも成功する', async () => {
      // Given: saveOGPMetadataが成功する状況と長いタイトル
      vi.mocked(saveOGPMetadata).mockResolvedValue();
      const longTitle = 'A'.repeat(1000);
      const formData = new FormData();
      formData.append('title', longTitle);
      formData.append('gradient', 'sunset');

      // When: アクションを実行
      await generateOGPAction(formData);

      // Then: 正常に処理される
      expect(saveOGPMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          title: longTitle,
        }),
      );
    });
  });

  describe('独立性の確保', () => {
    it('複数回実行しても独立したUUIDが生成される', async () => {
      // Given: saveOGPMetadataが成功する状況と複数のUUIDを返すモック
      vi.mocked(saveOGPMetadata).mockResolvedValue();
      const mockUUIDs = ['uuid-1', 'uuid-2', 'uuid-3'];
      let callCount = 0;
      vi.mocked(crypto.randomUUID).mockImplementation(
        () => mockUUIDs[callCount++],
      );

      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('gradient', 'sunset');

      // When: 複数回実行
      await generateOGPAction(formData);
      await generateOGPAction(formData);
      await generateOGPAction(formData);

      // Then: 各回で異なるUUIDが使用される
      expect(saveOGPMetadata).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: 'uuid-1' }),
      );
      expect(saveOGPMetadata).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ id: 'uuid-2' }),
      );
      expect(saveOGPMetadata).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ id: 'uuid-3' }),
      );
    });
  });
});
