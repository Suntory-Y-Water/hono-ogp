# Claude Code Configuration

## YOU MUST

日本語で回答する

## プロジェクト概要

OpenNext.jsを使用してCloudflare Workersにデプロイされた、Open Graph Protocol画像を動的に生成するNext.jsアプリケーション。

## 技術スタック

- **フレームワーク**: Next.js 15.3.4 (App Router), React 19.1.0
- **言語**: TypeScript 5.8.3
- **デプロイ**: Cloudflare Workers via @opennextjs/cloudflare
- **スタイリング**: Tailwind CSS 4.1.10
- **UI**: shadcn/ui with Radix UI primitives
- **フォーム**: React Hook Form with Zod validation
- **テスト**: Vitest with Happy DOM
- **リンティング**: Biome (2スペースインデント、シングルクォート、末尾カンマ)
- **パッケージマネージャー**: pnpm

## よく使用するコマンド

```bash
pnpm dev                # 開発サーバーをTurbopackで起動
pnpm build             # Next.jsアプリケーションをビルド
pnpm deploy            # Cloudflare Workersにビルド・デプロイ
pnpm test              # Vitestでテスト実行
pnpm lint              # Next.jsリンティング実行
pnpm typegen           # Cloudflare環境の型生成
```

## アーキテクチャ

### コア構造
- **App Router**: Server Components/Actionsを使用したファイルベースルーティング
- **画像生成**: `/api/ogp/[id]/route.tsx` - Next.js ImageResponseを使用した動的OGP画像エンドポイント
- **ストレージ**: Cloudflare R2 (画像) + KV (メタデータ)
- **フォーム**: `src/lib/actions/`でZodスキーマを使用したReact Hook Form

### 主要ディレクトリ
- `src/app/` - ページとAPIルート
- `src/components/features/` - ドメイン固有のコンポーネント（OGPフォーム、テンプレート）
- `src/lib/actions/` - OGP操作のServer Actions
- `src/lib/cloudflare.ts` - R2/KV統合レイヤー
- `src/lib/constants.ts` - グラデーションプリセットと定数

### 画像生成フロー
1. フォーム送信 → Server Action (`ogp-actions.ts`)
2. R2バケットに画像アップロード、KVストアにメタデータ保存
3. Reactコンポーネントでテンプレートレンダリング (`ogp-template.tsx`)
4. ImageResponse APIがPNG/JPEG生成

## 環境設定

- Cloudflare R2バケット: "ogp-images"
- KVネームスペース: "OGP_METADATA_KV"
- `wrangler.jsonc`でバインディング設定
- `cloudflare-env.d.ts`で型定義

## 開発パターン

- **関数**: コールバック以外でのアロー関数は使用しない、ネストよりも早期リターン
- **エラーハンドリング**: try-catchは最小限に、高確率エラーのみ
- **バリデーション**: すべてのフォーム入力にZodスキーマを使用
- **ファイルアップロード**: 1MB制限、特定のMIMEタイプのみ
- **コメント**: ビジネスロジックの説明は日本語で記述
- **テスト**: Vitest/Happy DOMでコンポーネントテスト

## コード生成生後の完了条件

- [ ] pnpm run lint, typecheck, testを実行してエラーが発生しないことを確認する

## パスエイリアス

- `@/*` → `./src/*`