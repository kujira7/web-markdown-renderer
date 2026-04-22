(function initMarkdownRendererContent(root) {
  "use strict";

  const ELEMENT_NODE = typeof Node !== "undefined" ? Node.ELEMENT_NODE : 1;
  const TEXT_NODE = typeof Node !== "undefined" ? Node.TEXT_NODE : 3;
  const DOCUMENT_FRAGMENT_NODE = typeof Node !== "undefined" ? Node.DOCUMENT_FRAGMENT_NODE : 11;

  if (typeof module === "undefined" || !module.exports) {
    if (window.__webMarkdownRendererContentLoaded) return;
    window.__webMarkdownRendererContentLoaded = true;
  }

  const ROOT_ID = "web-markdown-renderer-root";
  const normalizationRules = root.MarkdownNormalizationRules || loadNormalizationRulesForNode();
  const sourceNormalizationRules = normalizationRules?.SOURCE_NORMALIZATION_RULES || [];

  if (typeof chrome !== "undefined" && chrome.runtime && typeof document !== "undefined") {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "MARKDOWN_RENDERER_PING") {
        sendResponse({ ok: true });
        return;
      }
      if (message?.type !== "MARKDOWN_RENDERER_OPEN") return;
      const text = message.text || getSelectedText();
      if (!text.trim()) return;
      openViewer(text);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeViewer();
      }
    });
  }

  function getSelectedText() {
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0) return "";

    const fragments = [];
    for (let index = 0; index < selection.rangeCount; index += 1) {
      fragments.push(extractRangeText(selection.getRangeAt(index)));
    }

    const restored = normalizeSourceText(fragments.join("\n"));
    const nativeText = normalizeSourceText(String(selection || ""));
    return chooseSourceText(restored, nativeText);
  }

  function extractRangeText(range) {
    const container = document.createElement("div");
    container.appendChild(range.cloneContents());
    return textFromNode(container);
  }

  function textFromNode(node) {
    if (node.nodeType === TEXT_NODE) return node.nodeValue || "";
    if (node.nodeType !== ELEMENT_NODE && node.nodeType !== DOCUMENT_FRAGMENT_NODE) return "";

    if (node.nodeType === ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      if (tag === "br") return "\n";
      if (tag === "hr") return "\n\n---\n\n";
      if (tag === "table") return `\n${tableToMarkdown(node)}\n`;
      if (tag === "li") return `- ${childrenText(node)}\n`;
      if (tag === "pre") return `\n${node.textContent || ""}\n`;
      if (/^h[1-6]$/.test(tag)) {
        return `\n${"#".repeat(Number(tag[1]))} ${childrenText(node)}\n\n`;
      }
      if (tag === "p" || tag === "div" || tag === "section" || tag === "article") {
        return `\n${childrenText(node)}\n`;
      }
      if (tag === "ul" || tag === "ol" || tag === "blockquote") {
        return `\n${childrenText(node)}\n`;
      }
    }

    return childrenText(node);
  }

  function childrenText(node) {
    return Array.from(node.childNodes).map(textFromNode).join("");
  }

  function tableToMarkdown(table) {
    const rows = Array.from(table.querySelectorAll("tr"))
      .map((row) => Array.from(row.children).filter((cell) => isTableCell(cell)))
      .filter((row) => row.length > 0);

    if (rows.length === 0) return normalizeCellText(table.textContent || "");

    const headerIndex = rows.findIndex((row) => row.some((cell) => cell.tagName.toLowerCase() === "th"));
    const header = rows[headerIndex >= 0 ? headerIndex : 0].map(cellToMarkdown);
    const body = rows.filter((_row, index) => index !== (headerIndex >= 0 ? headerIndex : 0)).map((row) => row.map(cellToMarkdown));
    const columnCount = Math.max(header.length, ...body.map((row) => row.length), 1);

    return [
      renderMarkdownTableRow(padCells(header, columnCount)),
      renderMarkdownTableRow(Array.from({ length: columnCount }, () => "---")),
      ...body.map((row) => renderMarkdownTableRow(padCells(row, columnCount)))
    ].join("\n");
  }

  function isTableCell(node) {
    const tag = node.tagName?.toLowerCase();
    return tag === "th" || tag === "td";
  }

  function cellToMarkdown(cell) {
    return normalizeCellText(childrenText(cell)).replace(/\|/g, "\\|");
  }

  function normalizeCellText(text) {
    return String(text || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function padCells(cells, length) {
    return cells.concat(Array.from({ length: Math.max(length - cells.length, 0) }, () => ""));
  }

  function renderMarkdownTableRow(cells) {
    return `| ${cells.join(" | ")} |`;
  }

  function normalizeSourceText(text) {
    return normalizationRules.applyNormalizationRules(String(text || ""), sourceNormalizationRules, {
      normalizeSourceWhitespace,
      normalizeMarkdownBlockBoundaries,
      normalizeMermaidBlockSpacing,
      normalizePrefixedPipeTableHeaders,
      normalizeMarkdownBlockSpacing,
      finalizeSourceText
    });
  }

  function normalizeSourceWhitespace(text) {
    return String(text || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n");
  }

  function finalizeSourceText(text) {
    return String(text || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function chooseSourceText(restored, nativeText) {
    if (!restored) return nativeText || "";
    if (!nativeText) return restored;
    return shouldPreferNativeSource(restored, nativeText) ? nativeText : restored;
  }

  function shouldPreferNativeSource(restored, nativeText) {
    const restoredLines = countLines(restored);
    const nativeLines = countLines(nativeText);
    if (nativeLines < restoredLines + 2) return false;
    if (hasPipeTable(restored) && !hasPipeTable(nativeText)) return false;
    return hasMarkdownBlockMarkers(nativeText);
  }

  function countLines(text) {
    return String(text || "").split("\n").length;
  }

  function hasMarkdownBlockMarkers(text) {
    return /(?:^|\n)\s*(?:#{1,6}\s+|```|~~~|\|.*\|)/.test(String(text || ""));
  }

  function hasPipeTable(text) {
    return /(?:^|\n)\s*\|.*\|\s*(?:\n|$)/.test(String(text || ""));
  }

  function normalizeMarkdownBlockBoundaries(text) {
    const lines = String(text || "").split("\n");
    const output = [];
    let inFence = false;
    let fenceMarker = "";

    for (const line of lines) {
      const fence = line.match(/^\s*(```+|~~~+)/);
      if (fence && !inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (fence && inFence && fence[1][0] === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }

      output.push(inFence ? line : splitCollapsedMarkdownBlockMarkers(line));
    }

    return output.join("\n");
  }

  function splitCollapsedMarkdownBlockMarkers(line) {
    return String(line || "")
      .replace(/([^#\n])(?=#{2,6}\s+)/g, "$1\n\n")
      .replace(/([^\n])(?=```|~~~)/g, "$1\n\n");
  }

  function normalizeMermaidBlockSpacing(text) {
    const lines = String(text || "").split("\n");
    const output = [];
    let inMermaid = false;
    let fenceMarker = "";

    for (const line of lines) {
      const openingFence = line.match(/^\s*(```+|~~~+)\s*mermaid\s*$/i);
      const closingFence = line.match(/^\s*(```+|~~~+)\s*$/);

      if (openingFence && !inMermaid) {
        inMermaid = true;
        fenceMarker = openingFence[1][0];
        output.push(line);
        continue;
      }

      if (closingFence && inMermaid && closingFence[1][0] === fenceMarker) {
        inMermaid = false;
        fenceMarker = "";
        output.push(line);
        continue;
      }

      output.push(inMermaid ? splitCollapsedMermaidStatements(line) : line);
    }

    return output.join("\n");
  }

  function splitCollapsedMermaidStatements(line) {
    return String(line || "").replace(/\bend[ \t]{2,}(?=(?:subgraph\b|[A-Za-z0-9_]+\s*(?:-->|-\.->)))/g, "end\n");
  }

  function normalizePrefixedPipeTableHeaders(text) {
    const lines = String(text || "").split("\n");
    const output = [];
    let inFence = false;
    let fenceMarker = "";

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const fence = line.match(/^\s*(```+|~~~+)/);

      if (fence && !inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (fence && inFence && fence[1][0] === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }

      const normalized = inFence ? null : splitPrefixedPipeTableHeader(line, lines[index + 1]);
      if (normalized) {
        output.push(normalized.prefix, "", normalized.header);
      } else {
        output.push(line);
      }
    }

    return output.join("\n");
  }

  function splitPrefixedPipeTableHeader(line, nextLine) {
    if (!isTableSeparator(nextLine)) return null;

    const columnCount = splitTableCells(nextLine).length;
    const headerStart = findTableRowStart(line, columnCount);
    if (headerStart <= 0) return null;

    const prefix = line.slice(0, headerStart).trimEnd();
    const header = line.slice(headerStart).trim();
    if (!prefix || splitTableCells(header).length !== columnCount) return null;

    return { prefix, header };
  }

  function isTableSeparator(line) {
    return typeof line === "string" && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  function splitTableCells(line) {
    return String(line || "")
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function findTableRowStart(text, columnCount) {
    const pipeIndexes = [];
    for (let index = 0; index < text.length; index += 1) {
      if (text[index] === "|" && text[index - 1] !== "\\") pipeIndexes.push(index);
    }

    const requiredPipes = columnCount + 1;
    if (pipeIndexes.length < requiredPipes) return -1;
    return pipeIndexes[pipeIndexes.length - requiredPipes];
  }

  function normalizeMarkdownBlockSpacing(text) {
    const lines = String(text || "").split("\n");
    const output = [];
    let inFence = false;
    let fenceMarker = "";

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const fence = line.match(/^\s*(```+|~~~+)/);

      if (fence && !inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (fence && inFence && fence[1][0] === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }

      if (!inFence && line.trim() === "" && isBetweenCompactMarkdownLines(lines, index)) {
        continue;
      }

      output.push(line);
    }

    return output.join("\n");
  }

  function isBetweenCompactMarkdownLines(lines, index) {
    const previous = findPreviousNonEmptyLine(lines, index);
    const next = findNextNonEmptyLine(lines, index);
    if (!previous || !next) return false;
    return (isListLine(previous) && isListLine(next)) || (isBlockquoteLine(previous) && isBlockquoteLine(next));
  }

  function findPreviousNonEmptyLine(lines, index) {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (lines[cursor].trim() !== "") return lines[cursor];
    }
    return "";
  }

  function findNextNonEmptyLine(lines, index) {
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (lines[cursor].trim() !== "") return lines[cursor];
    }
    return "";
  }

  function isListLine(line) {
    return /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
  }

  function isBlockquoteLine(line) {
    return /^\s*>\s?/.test(line);
  }

  function openViewer(text) {
    closeViewer();

    const root = document.createElement("div");
    root.id = ROOT_ID;

    const backdrop = document.createElement("div");
    backdrop.className = "umr-backdrop";
    backdrop.addEventListener("click", closeViewer);

    const panel = document.createElement("aside");
    panel.className = "umr-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Markdown renderer");
    panel.tabIndex = -1;

    const header = document.createElement("header");
    header.className = "umr-header";

    const titleGroup = document.createElement("div");
    const title = document.createElement("div");
    title.className = "umr-title";
    title.textContent = "Markdown Renderer";
    const subtitle = document.createElement("div");
    subtitle.className = "umr-subtitle";
    subtitle.textContent = `${text.length.toLocaleString()} chars`;
    titleGroup.append(title, subtitle);

    const actions = document.createElement("div");
    actions.className = "umr-actions";
    const expandButton = document.createElement("button");
    expandButton.type = "button";
    expandButton.className = "umr-button";
    expandButton.setAttribute("aria-pressed", "false");
    expandButton.textContent = "Full page";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "umr-button";
    copyButton.textContent = "Copy source";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "umr-icon-button";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.textContent = "\u00d7";
    closeButton.addEventListener("click", closeViewer);
    actions.append(expandButton, copyButton, closeButton);
    header.append(titleGroup, actions);

    const main = document.createElement("main");
    main.className = "umr-content markdown-body";
    main.innerHTML = window.MarkdownRenderer.renderMarkdown(text);

    const source = document.createElement("details");
    source.className = "umr-source";
    const summary = document.createElement("summary");
    summary.textContent = "Source";
    const pre = document.createElement("pre");
    pre.textContent = text;
    source.append(summary, pre);

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = "Copied";
      } catch (_error) {
        copyButton.textContent = "Copy failed";
      }
      window.setTimeout(() => {
        copyButton.textContent = "Copy source";
      }, 1200);
    });

    expandButton.addEventListener("click", () => {
      const isExpanded = root.classList.toggle("umr-expanded");
      expandButton.setAttribute("aria-pressed", String(isExpanded));
      expandButton.textContent = isExpanded ? "Side panel" : "Full page";
    });

    panel.append(header, main, source);
    root.append(backdrop, panel);

    document.documentElement.appendChild(root);
    panel.focus();
    renderMermaidDiagrams(main);
  }

  function closeViewer() {
    document.getElementById(ROOT_ID)?.remove();
  }

  async function renderMermaidDiagrams(root) {
    const nodes = Array.from(root.querySelectorAll(".mermaid"));
    if (nodes.length === 0 || !window.mermaid) return;

    try {
      window.mermaid.initialize({
        flowchart: {
          htmlLabels: true
        },
        startOnLoad: false,
        securityLevel: "loose",
        theme: "default"
      });
    } catch (error) {
      console.warn("Web Markdown Renderer could not initialize Mermaid.", error);
      return;
    }

    for (const [index, node] of nodes.entries()) {
      try {
        const source = readMermaidSource(node);
        const id = `umr-mermaid-${Date.now()}-${index}`;
        const result = await window.mermaid.render(id, source);
        node.innerHTML = result.svg;
        if (result.bindFunctions) result.bindFunctions(node);
      } catch (error) {
        node.classList.add("umr-mermaid-error");
        console.warn("Web Markdown Renderer could not render a Mermaid diagram.", error);
      }
    }
  }

  function readMermaidSource(node) {
    const encoded = node.getAttribute("data-source");
    if (!encoded) return node.textContent || "";

    try {
      return decodeURIComponent(encoded);
    } catch (_error) {
      return node.textContent || "";
    }
  }

  function loadNormalizationRulesForNode() {
    if (typeof require !== "function") return null;
    try {
      return require("./normalization-rules");
    } catch (_error) {
      return null;
    }
  }

  const api = {
    chooseSourceText,
    listNormalizationRules: normalizationRules.listNormalizationRules,
    normalizeMarkdownBlockSpacing,
    normalizeSourceText,
    textFromNode
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.MarkdownRendererContent = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
