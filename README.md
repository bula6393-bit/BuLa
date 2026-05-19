# 折り紙・切り紙パターン検索システム

VS Code 用のプロトタイプです。

## 開き方

1. `origami_pattern_site_japanese_vscode` フォルダを VS Code で開く。
2. 拡張機能 **Live Server** をインストールする。
3. `index.html` を右クリックする。
4. **Open with Live Server** を選択する。

注意：`index.html` をダブルクリックで開くと、`data.json` が読み込まれない場合があります。
そのため、必ず Live Server で開いてください。

## 画像の追加方法

1. 画像ファイルを `images` フォルダに入れる。
2. `data.json` を開く。
3. 対象パターンに `imageUrl` を追加する。

例：

```json
"imageUrl": "images/miura.jpg"
```

例：

```json
{
  "RecordID": "P001",
  "VariantName": "Miura-ori",
  "imageUrl": "images/miura.jpg"
}
```

## ファイル構成

- `index.html`：サイトの構造
- `style.css`：デザイン
- `script.js`：検索、フィルター、カード表示
- `data.json`：パターンデータ
- `images/`：画像フォルダ

## 主な機能

- キーワード検索
- カテゴリー別フィルター
- ファミリー別フィルター
- 基本パターン別フィルター
- 優先度フィルター
- 修士研究で使うパターンの絞り込み
- 詳細表示
- 画像表示
