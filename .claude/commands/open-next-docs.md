## Open Next.js Docs

OpenNext.jsのCloudflareドキュメントを確認するときに使用するコマンドです。

全てのドキュメントを再帰的に確認する。

```bash
find .claude/docs/cloudflare/opennext-docs/opennext -name "*.mdx" -type f | sort | while read file; do
  echo "=== $file ==="
  cat "$file"
  echo -e "\n\n"
done
```

個別ファイルを確認する場合は以下のコマンドを使用します。

```bash
# メインドキュメント
cat .claude/docs/cloudflare/opennext-docs/opennext/index.mdx

# 始め方
cat .claude/docs/cloudflare/opennext-docs/opennext/get-started.mdx

# バインディング設定
cat .claude/docs/cloudflare/opennext-docs/opennext/bindings.mdx

# キャッシュ
cat .claude/docs/cloudflare/opennext-docs/opennext/caching.mdx

# 既知の問題
cat .claude/docs/cloudflare/opennext-docs/opennext/known-issues.mdx

# トラブルシューティング
cat .claude/docs/cloudflare/opennext-docs/opennext/troubleshooting.mdx

# How-toガイド
find .claude/docs/cloudflare/opennext-docs/opennext/howtos -name "*.mdx" -exec echo "=== {} ===" \; -exec cat {} \; -exec echo -e "\n\n" \;
```