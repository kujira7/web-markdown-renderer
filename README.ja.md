# Web Markdown Renderer

選択したテキストを GitHub 風の Markdown として読みやすく表示する Chrome 拡張です。

English README: [README.md](./README.md)

## できること

- 選択したテキストを GitHub Flavored Markdown として表示する
- fenced `mermaid` code block の Mermaid 図を表示する
- side panel で開き、必要に応じて full-page view に拡大できる
- 選択範囲に HTML table が含まれる場合、Markdown table に復元してから表示する
- 前後の文章や見出しに密着した Markdown table を分離して表示する
- 1行に潰れた一般的な pipe table を Markdown table に復元する
- Markdown table の各行間に入った余分な空行を取り除く
- list item や blockquote 行の間に入った余分な空行を取り除く
- Slack 風リンクを最小限だけ読みやすく正規化する
  - `<https://example.com|label>` を label 付きリンクとして表示
  - `<https://example.com>` を通常リンクとして表示
- 投稿、編集、返信、同期、外部サービスへの書き込みはしない

## インストール手順

この拡張は Chrome Web Store では配布していません。Chrome の unpacked extension として読み込みます。

### 1. リポジトリをダウンロードする

リポジトリを開きます。

```text
https://github.com/kujira7/web-markdown-renderer
```

次のどちらかの方法でダウンロードしてください。

方法A: Git を使う

```sh
git clone https://github.com/kujira7/web-markdown-renderer.git
```

方法B: ZIP を使う

1. GitHub のリポジトリページを開く
2. `Code` をクリック
3. `Download ZIP` をクリック
4. ZIP ファイルを展開する

### 2. Chrome に拡張を読み込む

1. Chrome を開く
2. `chrome://extensions` を開く
3. `Developer mode` を有効にする
4. `Load unpacked` をクリック
5. ダウンロードした `web-markdown-renderer` ディレクトリを選択する
6. 拡張一覧に `Web Markdown Renderer` が表示されることを確認する

重要: `manifest.json` が入っているディレクトリを選択してください。

## 使い方

### 基本操作

1. Slack、GitHub、Confluence、Notion など、Markdown 風テキストがあるページを開く
2. 読みたいテキストを選択する
3. 次のいずれかで viewer を開く
   - Windows/Linux: `Ctrl+M`
   - macOS: `Command+M`
   - 選択範囲を右クリックして `Read as Markdown`
   - 拡張アイコンをクリック

選択したテキストが読みやすい Markdown viewer で表示されます。

### 全画面表示

1. viewer を開く
2. `Full page` をクリック
3. side panel に戻す場合は `Side panel` をクリック

### Mermaid

選択したテキストに fenced `mermaid` code block が含まれている場合、Mermaid 図として表示します。

````md
```mermaid
flowchart LR
  A --> B
```
````

GitHub 風の表示に近づけるため、flowchart label の `<br/>` も有効にしています。

## ショートカット設定

Chrome 側で他のブラウザショートカット、OSショートカット、別の拡張と衝突すると、ショートカットが自動設定されない場合があります。

確認・設定手順:

1. `chrome://extensions/shortcuts` を開く
2. `Web Markdown Renderer` を探す
3. `Activate the extension` に `Ctrl+M` など利用可能なショートカットを設定する
4. 対象ページを再読み込みする

`Ctrl+M` が設定できない場合は、Chrome がショートカット衝突として拒否しています。その場合は `chrome://extensions/shortcuts` で別のキーを設定してください。

## 更新手順

Git でダウンロードした場合:

```sh
git pull
```

ZIP でダウンロードした場合:

1. GitHub から最新の ZIP をダウンロードする
2. ZIP を展開する
3. 古いディレクトリを新しいディレクトリで置き換える

更新後:

1. `chrome://extensions` を開く
2. `Web Markdown Renderer` の reload ボタンを押す
3. 対象ページを再読み込みする

## 制約

- `chrome://extensions` などの Chrome 内部ページでは動作しません
- Chrome Web Store や一部の組み込み PDF viewer では拡張 script がブロックされます
- この拡張は選択されたテキストだけを読みます。各サービスの API にはアクセスしません
- reader-only のツールです。投稿・編集機能は意図的に対象外です

## 開発

```sh
npm install
npm test
```

## ライセンス

MIT
