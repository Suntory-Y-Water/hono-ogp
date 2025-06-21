# OGP画像生成サービス 要件定義書 (Next.js版)

## プロジェクト概要

**要望ID**: ogp-002  
**タイトル**: Next.js + Cloudflare Workersを使ってOGP画像作成サービスを作りたい  
**概要**: 動的OGP画像生成サービス（記事タイトル、アイコン、著者、背景画像、グラデーション対応）

---

## 要件ジャッジ結果

### ✅ **実施判定**: Yes
- **優先度**: 高
- **判断理由**: 
  - Next.js App Routerでの現代的な開発体験
  - OpenNext.jsによるCloudflare Workers最適化
  - 既存サービスとの差別化要素（デザイン品質）
  - Cloudflare Free版での段階的実装が可能

### 📊 **影響範囲**
- **画面**: 3画面（作成フォーム、結果表示、画像配信）
- **ライブラリ**: 4個（satori、yoga-wasm-web、svg2png-wasm、wasm-image-optimization）
- **インフラ**: R2バケット、KV追加

---

## 変更対象ファイル・関数リスト

### 新規作成ファイル

#### **画面・ルーティング（App Router）**
- `src/app/page.tsx` - OGP作成フォーム画面
- `src/app/result/page.tsx` - 生成結果画面（クエリパラメータ: `?id=xxx`）
- `src/lib/ogp.ts` - OGP画像生成、OGP画像配信処理用メソッド

  #### **ライブラリ・ユーティリティ**
  - `src/lib/ogp.ts` - （Satori使用の画像生成ロジック）
  - `src/lib/cloudflare.ts` - （R2/D1/KV統合操作）
  - `src/lib/actions/ogp-actions.ts` - OGP生成・操作用Server Actions
  - `src/components/features/ogp-template.tsx` - （OGPテンプレートJSX）
  - `src/components/features/ogp-preview.tsx` - OGP画像プレビューコンポーネント

#### **クライアントサイドコンポーネント**
- `src/components/features/ogp-form.tsx` - OGP設定フォーム（リアルタイムプレビュー）

### 既存ファイル変更
- `package.json` - （依存関係追加）
- `wrangler.jsonc` - （R2バケット、KV設定追加）
- `next.config.ts` - 画像最適化設定追加
- `cloudflare-env.d.ts` - 環境変数型定義追加

---

## データ設計方針

### KVストレージ設計（単体・MVP）

#### **キー設計**
- 画像メタデータ: `ogp:${id}`

#### **値の構造**
- 画像ID、R2 URL、生成パラメータ（タイトル、グラデーション等）
- 作成日時

#### **設定**
- **TTL**: 1年間（31536000秒）
- **容量制限**: Free版1GB（約100万件保存可能）

### R2バケット設計
- **バケット名**: `ogp-images/images`
- **公開設定**: CDN配信有効
- **ファイル命名**: `${id}_${Date.now()}_${titleHash}.png`（メタデータ埋め込み）

---

## 画面設計方針

### 1. OGP作成フォーム (`/`)
- **UI**: Tailwind CSS 4.0 + shadcn/ui使用
- **フィールド**: 
  - タイトル（必須）
  - グラデーション選択（プリセット）
  - アイコン画像（Phase 2）
  - 著者名（Phase 2）
- **プレビュー**: Client Componentでリアルタイム表示

### 2. 結果画面 (`/result/[id]`)
- **表示内容**: 
  - 生成画像プレビュー
  - OGP URL（コピー機能付き）
  - 保存ボタン
- **機能**: KVへの永続化、SNSシェア
- **レスポンス**: PNG画像（Content-Type: image/png）
- **キャッシュ**: CDN + KVでの多層キャッシュ
- **TTL**: 1年間（immutable）

---

---

## 開発工数見積

### Phase 1: MVP（Free版対応）
| カテゴリ | タスク | 工数 | 状態 |
|----------|--------|------|------|
| **基盤構築** | Satori WASM統合 | 4h | 🔄 進行中 |
| | svg2png-wasm統合 | 3h | 📋 予定 |
| | R2/KV操作ライブラリ | 4h | 🔄 進行中 |
| **画面開発** | OGP作成フォーム（基本） | 6h | 🔄 進行中 |
| | 結果・プレビュー画面 | 4h | 📋 予定 |
| | Server Actions実装 | 4h | 📋 予定 |
| **画像生成** | 固定テンプレート | 8h | 🔄 進行中 |
| **最適化** | Free版制限対応 | 4h | 📋 予定 |

**Phase 1合計**: 37時間 ≈ **4.6人日**

### Phase 2: 拡張機能
| カテゴリ | タスク | 工数 |
|----------|--------|------|
| **機能拡張** | アイコン画像対応 | 6h |
| | 著者名表示 | 2h |
| | 背景画像対応 | 8h |

**Phase 2合計**: 16時間 ≈ **2人日**

**総合計**: 53時間 ≈ **6.6人日**

---

## 段階的機能アップデート方針

### Phase 1: MVP（Cloudflare Free版完全対応）
- **機能**: タイトル + グラデーション背景のみ
- **制約**: 10ms CPU制限内で完結
- **技術**: Satori軽量化 + svg2png-wasm
- **ストレージ**: KVでメタデータ管理

### Phase 2: 基本拡張
- **機能**: アイコン画像 + 著者名追加
- **制約**: 引き続きFree版内
- **最適化**: 画像圧縮 + テンプレート効率化

### Phase 3: 高度機能（将来検討）
- **機能**: 背景画像アップロード
- **制約**: この段階でPaid版検討

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 15.3.4 (App Router)
- **デプロイ**: OpenNext.js + Cloudflare Workers
- **スタイリング**: Tailwind CSS 4.0 + shadcn/ui
- **コンポーネント**: React Server Components + Client Components

### バックエンド
- **ランタイム**: Cloudflare Workers
- **画像生成**: Satori + svg2png-wasm
- **ストレージ**: R2 + KV

### 既存依存関係（追加必要）
```json
{
  "dependencies": {
    "satori": "^0.10.0",
    "svg2png-wasm": "^0.4.0",
  }
}
```

---

## Cloudflare制限対応策

### CPU時間制限（10ms）
- **Satoriテンプレート**: 超軽量化
- **フォント**: 事前用意1種類のみ
- **画像処理**: 最小限の変換処理

### メモリ制限（128MB）
- **画像サイズ**: 最大2MB制限
- **処理方式**: ストリーミング処理

### キャッシュ戦略
- **KVストレージ**: 生成済み画像のメタデータ保存
- **CDNキャッシュ**: Cloudflareエッジでの1年間キャッシュ
  - **容量管理**: KV 1GB制限内での運用

---

## Next.js特有の規約

### 🚫 **API Route使用禁止**
- **理由**: Server ComponentでRPCのようにServer Functionを呼び出したほうが高速
- **代替手段**: Server Components + Server Actions

### 📋 **開発規約**
- **データフェッチ**: サーバーコンポーネントでServer関数でデータを取得
- **ユーザーデータ操作**: `Server Actions`を使用（クライアントサイドでの操作）
- **キャッシュ**: 使用しない、常に`no-store`（キャッシュ無効化）で実装
- **画像**: `next/image`コンポーネントを使用
- **外部スクリプト**: `next/script`を使用して最適化
- **動的パラメータ**: `useSearchParams`や`/blog/[id]`等のparams受け取りは`async/await`で実装
- **データフェッチ**: `useEffect()`でのデータフェッチを控える

### 🏗️ **アーキテクチャ設計**
- **Server Components**: 初期レンダリング最適化、データフェッチ
- **Client Components**: インタラクティブ機能（フォーム、プレビュー）
- **Server Actions**: OGP画像生成、R2アップロード、KV操作

### 🔧 **実装方針**
```typescript
// Server Component例
async function OGPResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ogpData = await getOGPData(id); // Server Function
  return ogpData;
}

// Server Action例
async function generateOGPAction(formData: FormData) {
  'use server';
  // OGP生成処理
  const result = await generateOGPImage(formData);
  return result;
}
```

---

## 未確定事項 & TODO

### 【要確認①】パフォーマンス検証
- [ ] 10ms制限内でのSatori+PNG変換実測テスト
- [ ] 複数同時リクエスト時の処理能力確認
- [ ] OpenNext.jsでのWASMバンドル最適化

### 【要確認②】フォント準備
- [ ] 日本語対応フォントファイルの準備
- [ ] フォントファイルサイズ vs Workers制限の確認
- [ ] Next.js Font Optimizationとの連携

### 【要確認③】デザインテンプレート
- [ ] shadcn/uiベースのデザイン調整
- [ ] グラデーションパターンの選定（3-5種類）
- [ ] レスポンシブ対応

### 【要確認④】運用設計
- [ ] エラーハンドリング方針
- [ ] 画像の保持期間・削除ポリシー
- [ ] 監視・ログ設計
- [ ] wrangler.jsonc設定完成

---

## 現在の進捗状況

### ✅ 完了済み
- [x] Next.js + OpenNext.js基盤構築
- [x] Tailwind CSS 4.0 + shadcn/ui導入
- [x] 基本的なプロジェクト構造作成
- [x] Cloudflare Workers設定準備

### 🔄 進行中
- [ ] OGP生成ライブラリ実装
- [ ] Cloudflare統合ライブラリ実装
- [ ] OGPテンプレートコンポーネント実装

### 📋 次のステップ
1. 画像生成ライブラリ（Satori）の統合
2. Server Actions実装（OGP生成・R2アップロード・KV操作）
3. フォーム・プレビュー機能実装
4. R2/KV設定とデプロイ準備