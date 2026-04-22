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

## 正規化ルール

この拡張は厳密な Markdown parser ではなく、描画前にヒューリスティックな正規化ルールを適用します。

ルール定義の正本はコードです。現在のルールは適用フェーズごとに次のとおりです。

### Source Normalization

| ID | 目的 | 主なリスク |
| --- | --- | --- |
| `source-normalize-whitespace` | コピー由来の空白崩れを後続変換の前に正規化する | 意味のある行頭インデントを落とす可能性がある |
| `source-split-collapsed-markdown-blocks` | 潰れた見出しや fenced code marker を別行へ分離する | 見出し風の非 Markdown テキストを分割する可能性がある |
| `source-expand-collapsed-mermaid-lines` | fenced Mermaid 内で潰れた `end` 文を分離する | 1 行維持を意図した Mermaid テキストを書き換える可能性がある |
| `source-separate-prefixed-table-headers` | pipe table header に密着した前置きテキストを分離する | pipe を多く含む通常文を table header と誤認する可能性がある |
| `source-trim-compact-list-and-quote-spacing` | compact list と blockquote 内の余分な空行を除去する | 意図した空行を詰める可能性がある |
| `source-collapse-excess-blank-lines` | 連続空行を潰し末尾を trim する | 先頭末尾の空行が失われる |

### Render Normalization

| ID | 目的 | 主なリスク |
| --- | --- | --- |
| `render-normalize-line-endings` | 描画前に改行コードを LF に統一する | 実質的なユーザー影響は想定しない |
| `render-convert-yaml-front-matter` | 対応可能な先頭 YAML front matter をメタデータ表へ変換する | 非対応や曖昧な front matter はそのまま本文表示になる |
| `render-normalize-slack-links` | Slack 風 angle bracket link を標準 Markdown link に変換する | Slack 風に見える通常テキストを書き換える可能性がある |
| `render-expand-collapsed-pipe-tables` | 1 行に潰れた典型的な pipe table を復元する | pipe を多く含む通常文を table と誤認する可能性がある |
| `render-trim-sparse-table-spacing` | Markdown table 行間の空行を除去する | table 風テキスト周辺の意図した空行を潰す可能性がある |
| `render-separate-table-boundaries` | GFM が安定して読めるよう table 前後へ空行を入れる | table 風テキストを独立ブロック化する可能性がある |

## インストール手順

ローカル開発時は Chrome の unpacked extension として読み込みます。

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
   - 選択範囲を右クリックして `Render as Markdown`
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
3. `Activate the extension` に `Ctrl+M`、`Command+M`、または利用可能なショートカットを設定する
4. 対象ページを再読み込みする

ショートカットで起動しない場合:

1. `chrome://extensions/shortcuts` を開く
2. `Web Markdown Renderer` にショートカットが割り当てられているか確認する
3. 空欄の場合は手動で設定する
4. Chrome、OS、別の拡張と衝突している場合は別のキーを設定する
5. `chrome://extensions` で拡張を reload し、対象ページも再読み込みする

ショートカットは Chrome が extension script の注入を許可するページでのみ動作します。Chrome 内部ページ、Chrome Web Store、ブラウザが拡張をブロックするページでは動作しません。

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
- renderer-only のツールです。投稿・編集機能は意図的に対象外です

## 権限

- `activeTab`: ユーザーが拡張を実行した現在のタブにだけ一時的にアクセスするため
- `contextMenus`: 選択範囲の右クリックメニューに `Render as Markdown` を追加するため
- `scripting`: ユーザー操作後に現在のタブへ renderer script と CSS を注入するため

この拡張は `<all_urls>` などの host permission を要求せず、全ページで content script を常時実行せず、選択テキストを外部サービスへ送信しません。

## 開発

```sh
npm install
npm test
```

## Chrome Web Store 用パッケージ

Chrome Web Store へアップロードする ZIP を作成します。

```sh
npm run build:store
```

ZIP は `dist/` に作成され、開発用ファイルは含めません。

## ライセンス

MIT
