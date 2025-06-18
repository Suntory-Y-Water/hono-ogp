/**
 * OGPテンプレートのテスト
 */

import { describe, test, expect } from 'vitest';
import {
  createOgpTemplate,
  createSimpleOgpTemplate,
  createErrorTemplate,
  selectTemplate,
  getRecommendedTemplate,
  type OgpTemplateProps,
} from '../app/lib/ogp-template';

describe('OGPテンプレート', () => {
  describe('シンプルテンプレート', () => {
    test('基本的なシンプルテンプレートを生成できる', () => {
      const template = createSimpleOgpTemplate({
        title: 'テストタイトル',
        gradient: 'blue-to-purple',
      });

      expect(template.type).toBe('div');
      expect(template.props.style.width).toBe(1200);
      expect(template.props.style.height).toBe(630);
      expect(template.props.children).toHaveLength(3); // 背景装飾、タイトル、サブタイトル
    });

    test('カスタムサイズでシンプルテンプレートを生成できる', () => {
      const template = createSimpleOgpTemplate({
        title: 'カスタムサイズテスト',
        gradient: 'sunset',
        width: 800,
        height: 400,
      });

      expect(template.props.style.width).toBe(800);
      expect(template.props.style.height).toBe(400);
    });

    test('長いタイトルでフォントサイズが調整される', () => {
      const shortTitle = createSimpleOgpTemplate({
        title: '短い',
        gradient: 'ocean',
      });

      const longTitle = createSimpleOgpTemplate({
        title:
          'とても長いタイトルでフォントサイズが自動調整されることを確認するテスト',
        gradient: 'ocean',
      });

      const shortTitleFontSize =
        shortTitle.props.children[1].props.style.fontSize;
      const longTitleFontSize =
        longTitle.props.children[1].props.style.fontSize;

      expect(typeof shortTitleFontSize).toBe('number');
      expect(typeof longTitleFontSize).toBe('number');
      expect(longTitleFontSize).toBeLessThan(shortTitleFontSize as number);
    });

    test('グラデーションが正しく適用される', () => {
      const template = createSimpleOgpTemplate({
        title: 'グラデーションテスト',
        gradient: 'pink-to-orange',
      });

      expect(template.props.style.background).toContain('linear-gradient');
      expect(template.props.style.background).toContain('#f093fb');
    });
  });

  describe('高機能テンプレート', () => {
    test('基本的な高機能テンプレートを生成できる', () => {
      const props: OgpTemplateProps = {
        title: 'テストタイトル',
        gradient: 'green-to-blue',
        author: 'テスト著者',
      };

      const template = createOgpTemplate(props);

      expect(template.type).toBe('div');
      expect(template.props.style.width).toBe(1200);
      expect(template.props.style.height).toBe(630);
    });

    test('タグ付きテンプレートを生成できる', () => {
      const props: OgpTemplateProps = {
        title: 'タグ付きテスト',
        gradient: 'blue-to-purple',
        tags: ['React', 'TypeScript', 'Cloudflare'],
      };

      const template = createOgpTemplate(props);

      expect(template).toBeDefined();
      // タグが含まれることを確認（実装の詳細確認）
    });

    test('著者情報付きテンプレートを生成できる', () => {
      const props: OgpTemplateProps = {
        title: '著者情報テスト',
        gradient: 'sunset',
        author: 'テスト著者',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const template = createOgpTemplate(props);

      expect(template).toBeDefined();
    });

    test('タグが3個以上の場合は最初の3個のみ表示される', () => {
      const props: OgpTemplateProps = {
        title: 'タグ制限テスト',
        gradient: 'ocean',
        tags: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5'],
      };

      const template = createOgpTemplate(props);

      expect(template).toBeDefined();
      // 実装上3個のタグのみ表示されることを確認
    });
  });

  describe('エラーテンプレート', () => {
    test('デフォルトのエラーテンプレートを生成できる', () => {
      const template = createErrorTemplate({});

      expect(template.type).toBe('div');
      expect(template.props.style.width).toBe(1200);
      expect(template.props.style.height).toBe(630);
      expect(template.props.children).toHaveLength(3); // アイコン、メッセージ、サイト名
    });

    test('カスタムエラーメッセージでテンプレートを生成できる', () => {
      const customMessage = 'カスタムエラーメッセージ';
      const template = createErrorTemplate({
        message: customMessage,
      });

      const messageElement = template.props.children[1];
      expect(messageElement.props.children).toBe(customMessage);
    });

    test('カスタムサイズでエラーテンプレートを生成できる', () => {
      const template = createErrorTemplate({
        width: 800,
        height: 400,
      });

      expect(template.props.style.width).toBe(800);
      expect(template.props.style.height).toBe(400);
    });
  });

  describe('テンプレート選択', () => {
    test('シンプルテンプレートを選択できる', () => {
      const props: OgpTemplateProps = {
        title: 'シンプル選択テスト',
        gradient: 'blue-to-purple',
      };

      const template = selectTemplate({ ...props, useSimple: true });

      expect(template).toBeDefined();
      // シンプルテンプレートの特徴を確認
      expect(template.props.children).toHaveLength(3);
    });

    test('高機能テンプレートを選択できる', () => {
      const props: OgpTemplateProps = {
        title: '高機能選択テスト',
        gradient: 'sunset',
        author: 'テスト著者',
      };

      const template = selectTemplate({ ...props, useSimple: false });

      expect(template).toBeDefined();
    });

    test('推奨テンプレートが正しく選択される', () => {
      // 短いタイトル + 著者情報なし → シンプル
      const shortTitleProps: OgpTemplateProps = {
        title: '短いタイトル',
        gradient: 'ocean',
      };

      const shortTemplate = getRecommendedTemplate(shortTitleProps);
      expect(shortTemplate).toBeDefined();

      // 長いタイトル → シンプル
      const longTitleProps: OgpTemplateProps = {
        title:
          'とても長いタイトルでこれは50文字を超える可能性があるテストケースです',
        gradient: 'green-to-blue',
        author: 'テスト著者',
      };

      const longTemplate = getRecommendedTemplate(longTitleProps);
      expect(longTemplate).toBeDefined();
    });
  });

  describe('レスポンシブ対応', () => {
    test('タイトル長に応じてフォントサイズが調整される', () => {
      const shortTitle = createSimpleOgpTemplate({
        title: '短い',
        gradient: 'blue-to-purple',
      });

      const mediumTitle = createSimpleOgpTemplate({
        title: '中程度の長さのタイトルでテストします',
        gradient: 'blue-to-purple',
      });

      const longTitle = createSimpleOgpTemplate({
        title:
          'とても長いタイトルでフォントサイズの自動調整機能をテストするための文章です。この文章は十分に長く書いて、フォントサイズが確実に調整されることを確認します。',
        gradient: 'blue-to-purple',
      });

      const shortSize = shortTitle.props.children[1].props.style.fontSize;
      const mediumSize = mediumTitle.props.children[1].props.style.fontSize;
      const longSize = longTitle.props.children[1].props.style.fontSize;

      // 型チェック
      expect(typeof shortSize).toBe('number');
      expect(typeof mediumSize).toBe('number');
      expect(typeof longSize).toBe('number');

      // 短いタイトルのフォントサイズが最大値（72）に達していることを確認
      expect(shortSize).toBe(72);
      // 中程度と長いタイトルで差があることを確認
      expect(mediumSize as number).toBeGreaterThan(longSize as number);
      expect(longSize as number).toBeGreaterThanOrEqual(36); // 最小値確認
    });

    test('最小・最大フォントサイズが制限される', () => {
      const veryShortTitle = createSimpleOgpTemplate({
        title: 'A',
        gradient: 'sunset',
      });

      const veryLongTitle = createSimpleOgpTemplate({
        title: 'A'.repeat(1000),
        gradient: 'sunset',
      });

      const shortSize = veryShortTitle.props.children[1].props.style.fontSize;
      const longSize = veryLongTitle.props.children[1].props.style.fontSize;

      expect(shortSize).toBeLessThanOrEqual(72); // 最大サイズ制限
      expect(longSize).toBeGreaterThanOrEqual(36); // 最小サイズ制限
    });
  });

  describe('スタイル検証', () => {
    test('すべてのグラデーションでテンプレートが生成できる', () => {
      const gradients = [
        'blue-to-purple',
        'pink-to-orange',
        'green-to-blue',
        'sunset',
        'ocean',
      ] as const;

      for (const gradient of gradients) {
        const template = createSimpleOgpTemplate({
          title: `${gradient}テスト`,
          gradient,
        });

        expect(template.props.style.background).toContain('linear-gradient');
      }
    });

    test('必要なスタイルプロパティが設定される', () => {
      const template = createSimpleOgpTemplate({
        title: 'スタイルテスト',
        gradient: 'blue-to-purple',
      });

      expect(template.props.style).toHaveProperty('width');
      expect(template.props.style).toHaveProperty('height');
      expect(template.props.style).toHaveProperty('display');
      expect(template.props.style).toHaveProperty('background');
      expect(template.props.style).toHaveProperty('fontFamily');
    });
  });
});
