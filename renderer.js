(function initMarkdownRenderer(root) {
  "use strict";

  const markedApi = root.marked || loadMarkedForNode();

  function renderMarkdown(source) {
    return sanitizeHtml(parseMarkdown(normalizeMarkdownForRendering(source)));
  }

  function normalizeMarkdownForRendering(source) {
    return [
      normalizeLineEndings,
      normalizeLeadingYamlFrontMatter,
      normalizeSlackLinks,
      normalizeCollapsedPipeTables,
      normalizeSparsePipeTables,
      normalizeTableBoundaries
    ].reduce((text, normalize) => normalize(text), String(source || ""));
  }

  function normalizeLineEndings(text) {
    return String(text || "").replace(/\r\n?/g, "\n");
  }

  function normalizeLeadingYamlFrontMatter(text) {
    const extracted = extractLeadingYamlFrontMatter(text);
    if (!extracted) return text;

    const entries = parseSimpleYamlFrontMatter(extracted.frontMatter);
    if (!entries || entries.length === 0) return text;

    const table = renderFrontMatterTable(entries);
    if (!table) return text;

    const body = extracted.body.trimStart();
    return body ? `${table}\n\n${body}` : table;
  }

  function extractLeadingYamlFrontMatter(text) {
    const source = String(text || "");
    if (!source.startsWith("---\n")) return null;

    const lines = source.split("\n");
    for (let index = 1; index < lines.length; index += 1) {
      if (/^(---|\.\.\.)\s*$/.test(lines[index])) {
        return {
          frontMatter: lines.slice(1, index).join("\n"),
          body: lines.slice(index + 1).join("\n")
        };
      }
    }

    return null;
  }

  function parseSimpleYamlFrontMatter(text) {
    const lines = String(text || "").split("\n");
    const entries = [];

    for (let index = 0; index < lines.length; ) {
      const line = lines[index];
      if (line.trim() === "" || /^\s*#/.test(line)) {
        index += 1;
        continue;
      }

      if (/^\s/.test(line)) return null;

      const match = line.match(/^([A-Za-z0-9_-]+):(.*)$/);
      if (!match) return null;

      const key = match[1];
      const rest = match[2];
      const parsed = parseYamlValue(rest, lines, index + 1);
      if (!parsed) return null;

      entries.push({ key, value: parsed.value });
      index = parsed.nextIndex;
    }

    return entries;
  }

  function parseYamlValue(rest, lines, startIndex) {
    const trimmed = rest.trim();

    if (trimmed === "") {
      const block = collectIndentedBlock(lines, startIndex);
      if (!block) return { value: "", nextIndex: startIndex };
      const arrayValue = parseYamlArrayBlock(block.lines);
      if (!arrayValue) return null;
      return { value: arrayValue, nextIndex: block.nextIndex };
    }

    if (/^[>|][+-]?\d*$/.test(trimmed)) {
      const block = collectIndentedBlock(lines, startIndex);
      if (!block) return null;
      return {
        value: trimmed[0] === ">" ? foldYamlBlock(block.lines) : joinYamlBlock(block.lines),
        nextIndex: block.nextIndex
      };
    }

    if (/^[\[{]/.test(trimmed)) return null;

    return { value: normalizeScalarValue(trimmed), nextIndex: startIndex };
  }

  function collectIndentedBlock(lines, startIndex) {
    let baseIndent = null;
    let nextIndex = startIndex;
    const blockLines = [];

    for (; nextIndex < lines.length; nextIndex += 1) {
      const line = lines[nextIndex];
      if (line.trim() === "") {
        if (baseIndent === null) continue;
        blockLines.push("");
        continue;
      }

      const indent = line.match(/^\s*/)[0].length;
      if (baseIndent === null) {
        if (indent === 0) break;
        baseIndent = indent;
      }

      if (indent < baseIndent) break;
      blockLines.push(line.slice(baseIndent));
    }

    if (baseIndent === null) return null;
    return { lines: blockLines, nextIndex };
  }

  function parseYamlArrayBlock(lines) {
    const values = [];

    for (const line of lines) {
      if (line === "") continue;
      const match = line.match(/^- (.*)$/);
      if (!match) return null;
      const value = match[1].trim();
      if (value === "" || /^[\[{]/.test(value)) return null;
      values.push(normalizeScalarValue(value));
    }

    return values.join("<br>");
  }

  function foldYamlBlock(lines) {
    const paragraphs = [];
    let current = [];

    for (const line of lines) {
      if (line === "") {
        if (current.length > 0) {
          paragraphs.push(current.join(" "));
          current = [];
        } else if (paragraphs.length > 0) {
          paragraphs.push("");
        }
        continue;
      }

      current.push(line.trim());
    }

    if (current.length > 0) paragraphs.push(current.join(" "));
    return paragraphs.join("<br><br>");
  }

  function joinYamlBlock(lines) {
    return lines.join("<br>");
  }

  function normalizeScalarValue(value) {
    const trimmed = String(value || "").trim();
    const quoted = trimmed.match(/^(['"])([\s\S]*)\1$/);
    return quoted ? quoted[2] : trimmed;
  }

  function renderFrontMatterTable(entries) {
    const rows = entries.map(({ key, value }) => {
      const normalizedValue = String(value || "");
      return `<tr><th>${escapeHtml(key)}</th><td>${renderFrontMatterValue(normalizedValue)}</td></tr>`;
    });

    return rows.length > 0 ? `<table>\n<tbody>\n${rows.join("\n")}\n</tbody>\n</table>` : "";
  }

  function renderFrontMatterValue(value) {
    return escapeHtml(value).replace(/&lt;br&gt;/g, "<br>");
  }

  function normalizeSlackLinks(text) {
    return text
      .replace(/<((?:https?:\/\/|mailto:)[^>|]+)\|([^>]+)>/g, "[$2]($1)")
      .replace(/<((?:https?:\/\/|mailto:)[^>]+)>/g, "$1");
  }

  function normalizeTableBoundaries(text) {
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

      if (!inFence && isTableHeader(lines, index) && output.length > 0 && output[output.length - 1].trim() !== "") {
        output.push("");
      }

      output.push(line);

      if (!inFence && isTableRow(line) && isEndOfTable(lines, index)) {
        output.push("");
      }
    }

    return output.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function normalizeCollapsedPipeTables(text) {
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

      output.push(inFence ? line : restoreCollapsedTableLine(line));
    }

    return output.join("\n");
  }

  function normalizeSparsePipeTables(text) {
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

      if (!inFence && line.trim() === "" && isBetweenPipeTableLines(lines, index)) {
        continue;
      }

      output.push(line);
    }

    return output.join("\n");
  }

  function isBetweenPipeTableLines(lines, index) {
    const previous = findPreviousNonEmptyLine(lines, index);
    const next = findNextNonEmptyLine(lines, index);
    if (!previous || !next) return false;
    return isTableRow(previous) && (isTableRow(next) || isTableSeparator(next));
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

  function restoreCollapsedTableLine(line) {
    const separator = findCollapsedSeparator(line);
    if (!separator) return line;

    const before = line.slice(0, separator.index).trimEnd();
    const after = line.slice(separator.index + separator.text.length).trimStart();
    const headerStart = findTableRowStart(before, separator.columnCount);
    if (headerStart < 0) return line;

    const prefix = before.slice(0, headerStart).trimEnd();
    const header = before.slice(headerStart).trim();
    const body = consumeCollapsedRows(after, separator.columnCount);
    if (body.rows.length === 0) return line;

    return [
      prefix,
      "",
      header,
      separator.text.trim(),
      ...body.rows,
      body.rest.trimStart()
    ]
      .filter((part) => part !== "")
      .join("\n");
  }

  function findCollapsedSeparator(line) {
    const pattern = /\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|/g;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const text = match[0];
      const columnCount = splitTableCells(text).length;
      if (columnCount >= 2) {
        return { index: match.index, text, columnCount };
      }
    }
    return null;
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

  function consumeCollapsedRows(text, columnCount) {
    const rows = [];
    let rest = text.trimStart();

    while (rest.startsWith("|")) {
      const rowEnd = findTableRowEnd(rest, columnCount);
      if (rowEnd < 0) break;

      rows.push(rest.slice(0, rowEnd + 1).trim());
      rest = rest.slice(rowEnd + 1).trimStart();
    }

    return { rows, rest };
  }

  function findTableRowEnd(text, columnCount) {
    let seenPipes = 0;
    for (let index = 0; index < text.length; index += 1) {
      if (text[index] !== "|" || text[index - 1] === "\\") continue;
      seenPipes += 1;
      if (seenPipes === columnCount + 1) return index;
    }
    return -1;
  }

  function splitTableCells(line) {
    return String(line || "")
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function isTableHeader(lines, index) {
    return isTableRow(lines[index]) && isTableSeparator(lines[index + 1]);
  }

  function isEndOfTable(lines, index) {
    const nextLine = lines[index + 1];
    if (nextLine === undefined || nextLine.trim() === "") return false;
    return !isTableRow(nextLine) && !isTableSeparator(nextLine);
  }

  function isTableRow(line) {
    return typeof line === "string" && line.includes("|") && line.trim().split("|").length >= 3;
  }

  function isTableSeparator(line) {
    return typeof line === "string" && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  function parseMarkdown(text) {
    if (!markedApi?.marked) return `<pre><code>${escapeHtml(text)}</code></pre>`;

    const renderer = new markedApi.Renderer();
    renderer.code = ({ text: code, lang }) => {
      const language = String(lang || "").trim().split(/\s+/)[0].toLowerCase();
      if (language === "mermaid") {
        return `<div class="mermaid" data-source="${escapeAttr(encodeURIComponent(code))}">${escapeHtml(code)}</div>\n`;
      }
      const className = language ? ` class="language-${escapeAttr(language)}"` : "";
      return `<pre><code${className}>${escapeHtml(code).replace(/\n$/, "")}\n</code></pre>\n`;
    };

    return markedApi.marked.parse(text, {
      async: false,
      breaks: false,
      gfm: true,
      renderer
    });
  }

  function sanitizeHtml(html) {
    if (typeof document === "undefined") return sanitizeHtmlWithoutDom(html);

    const template = document.createElement("template");
    template.innerHTML = html;
    sanitizeNode(template.content);
    return template.innerHTML;
  }

  function sanitizeNode(parent) {
    Array.from(parent.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) return;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        node.remove();
        return;
      }

      const tag = node.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        node.replaceWith(document.createTextNode(node.textContent || ""));
        return;
      }

      sanitizeAttributes(node, tag);
      sanitizeNode(node);
    });
  }

  function sanitizeAttributes(node, tag) {
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (tag === "a" && name === "href") {
        node.setAttribute("href", isSafeUrl(value) ? value : "#");
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noreferrer noopener");
        return;
      }

      if (tag === "code" && name === "class" && /^language-[A-Za-z0-9_-]+$/.test(value)) return;
      if (tag === "div" && name === "class" && value === "mermaid") return;
      if (tag === "div" && name === "data-source" && node.classList.contains("mermaid")) return;
      if (tag === "input" && ["checked", "disabled", "type"].includes(name)) {
        if (name !== "type" || value === "checkbox") return;
      }
      if (["colspan", "rowspan"].includes(name) && /^\d{1,2}$/.test(value)) return;

      node.removeAttribute(attribute.name);
    });
  }

  function sanitizeHtmlWithoutDom(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
  }

  function loadMarkedForNode() {
    if (typeof require !== "function") return null;
    try {
      return require("./vendor/marked.umd.js");
    } catch (_error) {
      return null;
    }
  }

  function isSafeUrl(url) {
    return /^(https?:\/\/|mailto:|#)/i.test(String(url || "").trim());
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  const ALLOWED_TAGS = new Set([
    "a",
    "blockquote",
    "br",
    "code",
    "del",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "input",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul"
  ]);

  const api = {
    renderMarkdown,
    normalizeMarkdownForRendering,
    normalizeSlackLinks,
    normalizeCollapsedPipeTables,
    normalizeSparsePipeTables,
    normalizeTableBoundaries,
    sanitizeHtml
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.MarkdownRenderer = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
