# OGP Image Generator

Open Graph Protocol画像を動的に生成するNext.jsアプリケーション。Cloudflare Workers上で動作し、リアルタイムで美しいOGP画像を作成できます。

## 特徴

- 🎨 **動的OGP画像生成**: カスタマイズ可能なテンプレートでOGP画像を動的生成
- ☁️ **Cloudflare Workers**: OpenNext.jsを使用してCloudflare Workers上で実行
- 🚀 **高速レスポンス**: R2とKVストレージを活用した効率的なキャッシング
- 🎯 **複数テンプレート**: 様々なデザインテンプレートから選択可能
- 🔧 **TypeScript完全対応**: 型安全な開発環境
- 📱 **レスポンシブ対応**: モダンなUIとUX

## 技術スタック

- **フレームワーク**: Next.js 15.3.4 (App Router)
- **ランタイム**: React 19.1.0
- **言語**: TypeScript 5.8.3
- **デプロイ**: Cloudflare Workers via @opennextjs/cloudflare
- **スタイリング**: Tailwind CSS 4.1.10
- **UI**: shadcn/ui with Radix UI primitives
- **フォーム**: React Hook Form + Zod validation
- **テスト**: Vitest + Happy DOM
- **リンティング**: Biome
- **パッケージマネージャー**: pnpm

## セットアップ

### 前提条件

- Node.js 20+ 
- pnpm
- Cloudflareアカウント
- Wrangler CLI

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Suntory-Y-Water/open-next-ogp-image-generator
cd open-next-ogp-image-generator

# 依存関係をインストール
pnpm install

# Cloudflare環境の型を生成
pnpm typegen
```

### Cloudflare設定

1. Cloudflare R2バケット「ogp-images」を作成
2. KVネームスペース「OGP_METADATA_KV」を作成
3. `wrangler.jsonc`でバインディングを設定

```json
{
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "ogp-images"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "OGP_METADATA_KV",
      "id": "your-kv-namespace-id"
    }
  ]
}
```

## 開発

```bash
# 開発サーバーを起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test

# リンティング
pnpm lint

# 型チェック
pnpm typecheck

# Cloudflare Workersにデプロイ
pnpm deploy
```

## API

### OGP画像生成エンドポイント

```
GET /api/ogp/[id]
```

#### パラメータ

- `id`: 画像のユニークID

#### レスポンス

生成されたOGP画像（PNG/JPEG形式）

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/ogp/           # OGP画像生成API
│   └── page.tsx           # メインページ
├── components/
│   ├── features/          # ドメイン固有コンポーネント
│   │   ├── ogp-form.tsx   # OGP作成フォーム
│   │   └── ogp-template.tsx # 画像テンプレート
│   └── ui/                # 再利用可能UIコンポーネント
├── lib/
│   ├── actions/           # Server Actions
│   ├── cloudflare.ts      # R2/KV統合
│   └── constants.ts       # グラデーションプリセットなど
└── types/                 # TypeScript型定義
```

## 使用方法

1. アプリケーションにアクセス
2. タイトル、説明、背景色などを入力
3. テンプレートを選択
4. 「画像を生成」ボタンをクリック
5. 生成された画像URLを取得

## カスタマイズ

### 新しいテンプレートの追加

`src/components/features/ogp-template.tsx`でテンプレートコンポーネントを作成し、画像生成ロジックに組み込みます。

### グラデーションプリセットの追加

`src/lib/constants.ts`で新しいグラデーションを定義できます。

## デプロイ

```bash
# Cloudflare Workersにデプロイ
pnpm deploy

# プレビュー環境でテスト
pnpm preview
```

## ライセンス

このプロジェクトは[MIT License](LICENSE)の下で公開されています。

## サポート

質問やバグ報告は[GitHub Issues](https://github.com/your-username/ogp-image-generator/issues)でお気軽にどうぞ。
