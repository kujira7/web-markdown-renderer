const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "..", "viewer.css"), "utf8");

function assertRule(selector, declarations) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = Array.from(css.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, "g")));
  assert.ok(matches.length > 0, `missing CSS rule: ${selector}`);

  for (const declaration of declarations) {
    assert.ok(
      matches.some((match) => new RegExp(`${declaration.property}\\s*:\\s*${declaration.value}\\s*;`).test(match[1])),
      `missing declaration in ${selector}: ${declaration.property}`
    );
  }
}

assertRule("#web-markdown-renderer-root .markdown-body ul", [
  { property: "list-style-type", value: "disc" }
]);

assertRule("#web-markdown-renderer-root .markdown-body ol", [
  { property: "list-style-type", value: "decimal" }
]);

assertRule("#web-markdown-renderer-root .markdown-body li", [
  { property: "display", value: "list-item" }
]);

assertRule("#web-markdown-renderer-root .markdown-body li > ul,\n#web-markdown-renderer-root .markdown-body li > ol", [
  { property: "margin-bottom", value: "0" },
  { property: "margin-top", value: "0\\.25em" }
]);

assertRule("#web-markdown-renderer-root .markdown-body li:has(> input[type=\"checkbox\"])", [
  { property: "list-style-type", value: "none" }
]);

assertRule("#web-markdown-renderer-root .umr-paste-box", [
  { property: "display", value: "none" },
  { property: "resize", value: "vertical" },
  { property: "width", value: "100%" }
]);

assertRule("#web-markdown-renderer-root.umr-paste-mode .umr-paste-box", [
  { property: "display", value: "block" }
]);

console.log("viewer css tests passed");
