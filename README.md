# GraphCoaster

数式（陽関数 `y=f(x)` / 陰関数 `F(x,y)=0`）を入力して図形を描き、球を落として全ての通過点を通過させるブラウザゲームです。静的コンテンツのみで動作します。

技術スタック: Svelte 5 (runes) + Vite 7 / Flowbite Svelte + Tailwind CSS 4 / mathjs

## 開発

```bash
npm install
npm run dev
```

## ビルド・型チェック

```bash
npm run build
npm run check
```

## podman

ローカルプレビューサーバーを起動:

```bash
podman build -t graphcoaster-preview .
podman run --rm -p 8080:80 graphcoaster-preview
# http://localhost:8080
```

`dist/` だけを取り出す場合:

```bash
podman build --target build -t graphcoaster-build .
podman create --name gb-extract graphcoaster-build
podman cp gb-extract:/app/dist ./dist
podman rm gb-extract
```

## GitHub Pages への公開

`main` ブランチへの push で `.github/workflows/deploy.yml` が自動的にビルド・デプロイします。初回のみ、リポジトリの Settings → Pages → Source を "GitHub Actions" に設定してください。

## ライセンス

MIT
