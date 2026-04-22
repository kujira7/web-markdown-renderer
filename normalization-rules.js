(function initMarkdownNormalizationRules(root) {
  "use strict";

  const SOURCE_NORMALIZATION_RULES = [
    {
      id: "source-normalize-whitespace",
      phase: "source-normalization",
      description: "Normalize non-breaking spaces and strip trailing and line-leading indentation from selected text.",
      handler: "normalizeSourceWhitespace"
    },
    {
      id: "source-split-collapsed-markdown-blocks",
      phase: "source-normalization",
      description: "Split headings and fenced code markers that were collapsed onto surrounding text.",
      handler: "normalizeMarkdownBlockBoundaries"
    },
    {
      id: "source-expand-collapsed-mermaid-lines",
      phase: "source-normalization",
      description: "Split Mermaid statements that were collapsed onto the same line inside fenced mermaid blocks.",
      handler: "normalizeMermaidBlockSpacing"
    },
    {
      id: "source-separate-prefixed-table-headers",
      phase: "source-normalization",
      description: "Separate prose prefixes that were collapsed onto a Markdown pipe-table header row.",
      handler: "normalizePrefixedPipeTableHeaders"
    },
    {
      id: "source-trim-compact-list-and-quote-spacing",
      phase: "source-normalization",
      description: "Remove extra blank lines that appear inside compact lists and blockquotes.",
      handler: "normalizeMarkdownBlockSpacing"
    },
    {
      id: "source-collapse-excess-blank-lines",
      phase: "source-normalization",
      description: "Collapse runs of blank lines and trim the final normalized source text.",
      handler: "finalizeSourceText"
    }
  ];

  const RENDER_NORMALIZATION_RULES = [
    {
      id: "render-normalize-line-endings",
      phase: "render-normalization",
      description: "Normalize CRLF and CR line endings to LF before further rendering transforms.",
      handler: "normalizeLineEndings"
    },
    {
      id: "render-convert-yaml-front-matter",
      phase: "render-normalization",
      description: "Convert supported leading YAML front matter into a metadata table when parsing succeeds.",
      handler: "normalizeLeadingYamlFrontMatter"
    },
    {
      id: "render-normalize-slack-links",
      phase: "render-normalization",
      description: "Convert Slack-style angle-bracket links into standard Markdown links.",
      handler: "normalizeSlackLinks"
    },
    {
      id: "render-expand-collapsed-pipe-tables",
      phase: "render-normalization",
      description: "Restore common single-line collapsed pipe tables into multiline Markdown tables.",
      handler: "normalizeCollapsedPipeTables"
    },
    {
      id: "render-trim-sparse-table-spacing",
      phase: "render-normalization",
      description: "Remove blank lines inserted between Markdown pipe-table rows.",
      handler: "normalizeSparsePipeTables"
    },
    {
      id: "render-separate-table-boundaries",
      phase: "render-normalization",
      description: "Insert blank lines around Markdown tables so GFM parses them as standalone blocks.",
      handler: "normalizeTableBoundaries"
    }
  ];

  const NORMALIZATION_RULES = SOURCE_NORMALIZATION_RULES.concat(RENDER_NORMALIZATION_RULES);

  function applyNormalizationRules(text, rules, handlers) {
    return rules.reduce((current, rule) => {
      const handler = handlers[rule.handler];
      if (typeof handler !== "function") {
        throw new Error(`Missing normalization handler: ${rule.handler}`);
      }
      return handler(current);
    }, String(text || ""));
  }

  function listNormalizationRules(phase) {
    return NORMALIZATION_RULES
      .filter((rule) => !phase || rule.phase === phase)
      .map(({ id, phase: rulePhase, description }) => ({ id, phase: rulePhase, description }));
  }

  const api = {
    SOURCE_NORMALIZATION_RULES,
    RENDER_NORMALIZATION_RULES,
    NORMALIZATION_RULES,
    applyNormalizationRules,
    listNormalizationRules
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.MarkdownNormalizationRules = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
