# Web Markdown Renderer

Chrome extension for reading selected text as GitHub-like Markdown.

Japanese README: [README.ja.md](./README.ja.md)

## What It Does

- Opens selected text in an on-page Markdown viewer.
- Renders GitHub Flavored Markdown with tables, task lists, code blocks, and links.
- Renders fenced `mermaid` code blocks as Mermaid diagrams.
- Extracts selected HTML tables and renders them as Markdown tables.
- Cleans up common copy-and-paste artifacts before rendering:
  - collapsed pipe tables
  - missing spacing around tables
  - extra blank lines inside tables
  - Slack-style links such as `<https://example.com|label>`
- Restores selected HTML `<hr>` elements as Markdown thematic breaks (`---`)
- Shows the normalized source text and provides a `Copy source` action.
- Opens as a side panel and can expand to a full-page overlay.
- Runs locally in the browser and does not post, edit, sync, or write back to any service.

## Normalization Rules

This extension uses heuristic normalization rules before rendering. It is not a strict Markdown parser.

Code is the source of truth for the rule registry. The current rules are grouped by phase below.

### Source Normalization

| ID | Purpose | Main Risk |
| --- | --- | --- |
| `source-normalize-whitespace` | Normalize copied non-breaking spaces and trailing spaces before block-level transforms. | No material user-visible risk expected. |
| `source-split-collapsed-markdown-blocks` | Split collapsed headings and fenced code markers onto separate lines. | Non-Markdown text that resembles headings can be split. |
| `source-expand-collapsed-mermaid-lines` | Split collapsed Mermaid `end` statements inside fenced Mermaid blocks. | Mermaid text that intentionally keeps spacing on one line can be rewritten. |
| `source-separate-prefixed-table-headers` | Separate prose prefixes from pipe-table header rows. | Prose containing many pipes can be mistaken for a table header. |
| `source-collapse-excess-blank-lines` | Collapse repeated blank lines and drop leading or trailing blank lines from the final normalized source. | Significant leading or trailing blank lines are dropped. |

### Render Normalization

| ID | Purpose | Main Risk |
| --- | --- | --- |
| `render-normalize-line-endings` | Normalize line endings before rendering transforms. | No material user-visible risk expected. |
| `render-convert-yaml-front-matter` | Convert supported leading YAML front matter into a metadata table. | Unsupported or ambiguous front matter stays as Markdown text. |
| `render-normalize-slack-links` | Convert Slack-style angle-bracket links into standard Markdown links outside fenced and inline code. | Angle-bracket text that looks like a Slack link can be rewritten. |
| `render-expand-collapsed-pipe-tables` | Restore common one-line collapsed pipe tables outside fenced and inline code. | Pipe-heavy prose can be mistaken for a table. |
| `render-trim-sparse-table-spacing` | Remove blank lines between Markdown table rows. | Intentional spacing around table-like text can be collapsed. |
| `render-separate-table-boundaries` | Insert blank lines around Markdown tables for stable GFM parsing. | Table-looking text can be separated into its own block. |

## Installation

For local development, install it as an unpacked extension.

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
   - Right-click the selection and choose `Render as Markdown`.
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
3. Set `Activate the extension` to `Ctrl+M`, `Command+M`, or another available shortcut.
4. Reload the target web page.

If the shortcut does not work:

1. Open `chrome://extensions/shortcuts`.
2. Confirm that `Web Markdown Renderer` has an assigned shortcut.
3. If the field is blank, set it manually.
4. If the shortcut is already used by Chrome, the OS, or another extension, choose another shortcut.
5. Open `chrome://extensions`, reload the extension, then reload the target web page.

The shortcut only works on pages where Chrome allows extension script injection. It does not work on Chrome internal pages, Chrome Web Store pages, or pages where the browser blocks extensions.

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
- A `---` line directly under body text can still be interpreted as a setext heading, matching GitHub/CommonMark behavior.
- The extension reads selected text only. It does not access service APIs.
- It is a renderer-only tool. Posting and editing features are intentionally out of scope.

## Permissions

- `activeTab`: grants temporary access to the current tab only after the user invokes the extension.
- `contextMenus`: adds the `Render as Markdown` item to the selection context menu.
- `scripting`: injects the renderer scripts and CSS into the current tab after user action.

The extension does not request host permissions such as `<all_urls>`, does not run content scripts on every page by default, and does not send selected text to external services.

## Development

```sh
npm install
npm test
```

## Chrome Web Store Package

Build the ZIP file for Chrome Web Store upload:

```sh
npm run build:store
```

The package is written to `dist/` and excludes development-only files.

## License

MIT
