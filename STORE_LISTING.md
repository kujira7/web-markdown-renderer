# Chrome Web Store Listing

## Extension Name

Web Markdown Renderer

## Short Description

Render selected Markdown locally in the current tab.

## Detailed Description

Web Markdown Renderer opens selected text in an on-page Markdown viewer.

It is designed for pages that contain Markdown-like text, such as comments, chat messages, documentation drafts, issue descriptions, and copied snippets.

Features:

- Render selected text as GitHub Flavored Markdown
- Render Markdown tables, task lists, code blocks, links, and blockquotes
- Render fenced `mermaid` code blocks as Mermaid diagrams
- Convert selected HTML tables into Markdown tables before rendering
- Clean up common copy-and-paste artifacts, including collapsed pipe tables and extra blank lines
- Show the normalized source text
- Copy the normalized source text to the clipboard after user action
- Expand the viewer from a side panel to a full-page overlay

Privacy:

- No account required
- No analytics
- No external API calls
- No data collection
- No data selling or sharing
- Selected text is processed locally in the current browser tab

## Single Purpose

Web Markdown Renderer renders user-selected Markdown-like text locally in the current tab.

## Permission Justification

### activeTab

Required to access the current tab only after the user invokes the extension. The extension uses this access to read the selected text and show the Markdown viewer in that tab.

### contextMenus

Required to add the `Render as Markdown` item to the selection context menu.

### scripting

Required to inject the renderer JavaScript and CSS into the current tab after the user invokes the extension.

## Privacy Practices

Recommended Chrome Web Store privacy disclosure:

- Data collection: No
- Data sale: No
- Data transfer for unrelated purposes: No
- Remote code: No
- Analytics: No

Notes:

- The extension reads selected text only after user action.
- The selected text is processed locally.
- The extension does not send selected text to external services.
- The extension does not use `host_permissions`.
- The extension does not run content scripts on every page by default.
