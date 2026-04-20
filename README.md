# Web Markdown Renderer

Chrome extension for reading selected text as GitHub-like Markdown.

Japanese README: [README.ja.md](./README.ja.md)

## What It Does

- Renders selected text as GitHub Flavored Markdown.
- Supports Mermaid diagrams in fenced `mermaid` code blocks.
- Opens as a side panel and can expand to full-page view.
- Restores selected HTML tables into Markdown tables before rendering.
- Separates tightly pasted Markdown tables from adjacent paragraphs and headings.
- Restores common one-line collapsed pipe tables back into Markdown tables.
- Removes accidental blank lines inserted between Markdown table rows.
- Removes accidental blank lines inserted between list items and blockquote lines.
- Applies minimal Slack-style link normalization:
  - `<https://example.com|label>` becomes a readable labeled link.
  - `<https://example.com>` becomes a normal link.
- Never posts, edits, replies, syncs, or writes back to any service.

## Installation

This extension is not distributed through the Chrome Web Store. Install it as an unpacked extension.

### 1. Download the Repository

Open the repository page:

```text
https://github.com/kujira7/web-markdown-renderer
```

Download it with either method.

Option A: Git

```sh
git clone https://github.com/kujira7/web-markdown-renderer.git
```

Option B: ZIP

1. Open the GitHub repository page.
2. Click `Code`.
3. Click `Download ZIP`.
4. Extract the ZIP file.

### 2. Load the Extension in Chrome

1. Open Chrome.
2. Open `chrome://extensions`.
3. Turn on `Developer mode`.
4. Click `Load unpacked`.
5. Select the downloaded `web-markdown-renderer` directory.
6. Confirm that `Web Markdown Renderer` appears in the extension list.

Important: select the directory that contains `manifest.json`.

## How to Use

### Basic Usage

1. Open a web page such as Slack, GitHub, Confluence, Notion, or any page that contains Markdown-like text.
2. Select the text you want to read.
3. Open the viewer with one of these actions:
   - Press `Ctrl+M` on Windows/Linux.
   - Press `Command+M` on macOS.
   - Right-click the selection and choose `Read as Markdown`.
   - Click the extension icon.

The selected text opens in a readable Markdown viewer.

### Full-Page View

1. Open the viewer.
2. Click `Full page`.
3. Click `Side panel` to return to the side panel view.

### Mermaid

Mermaid diagrams render when the selected text contains a fenced `mermaid` code block.

````md
```mermaid
flowchart LR
  A --> B
```
````

Flowchart HTML labels such as `<br/>` are enabled for GitHub-like rendering.

## Shortcut Setup

Chrome may not automatically assign the shortcut if it conflicts with another browser, OS, or extension shortcut.

To check or set the shortcut:

1. Open `chrome://extensions/shortcuts`.
2. Find `Web Markdown Renderer`.
3. Set `Activate the extension` to `Ctrl+M` or another available shortcut.
4. Reload the target web page.

If `Ctrl+M` cannot be assigned, Chrome is rejecting it because of a shortcut conflict. Choose another shortcut in `chrome://extensions/shortcuts`.

## Updating

If you downloaded with Git:

```sh
git pull
```

If you downloaded a ZIP:

1. Download the latest ZIP from GitHub.
2. Extract it.
3. Replace the old directory with the new one.

After updating:

1. Open `chrome://extensions`.
2. Click the reload button on `Web Markdown Renderer`.
3. Reload the target web page.

## Limitations

- Chrome internal pages such as `chrome://extensions` cannot be read by this extension.
- Chrome Web Store pages and some built-in PDF viewers may block extension scripts.
- The extension reads selected text only. It does not access service APIs.
- It is a reader-only tool. Posting and editing features are intentionally out of scope.

## Development

```sh
npm install
npm test
```
