const assert = require("node:assert/strict");
const { chooseSourceText, listNormalizationRules, normalizeMarkdownBlockSpacing, normalizeSourceText, textFromNode } = require("../content");

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function text(value) {
  return {
    nodeType: TEXT_NODE,
    nodeValue: value
  };
}

function element(tagName, children = []) {
  return {
    nodeType: ELEMENT_NODE,
    tagName,
    childNodes: children,
    textContent: flattenText(children)
  };
}

function flattenText(nodes) {
  return nodes
    .map((node) => {
      if (node.nodeType === TEXT_NODE) return node.nodeValue || "";
      return node.textContent || "";
    })
    .join("");
}

assert.deepEqual(listNormalizationRules("source-normalization").map((rule) => rule.id), [
  "source-normalize-whitespace",
  "source-split-collapsed-markdown-blocks",
  "source-expand-collapsed-mermaid-lines",
  "source-separate-prefixed-table-headers",
  "source-trim-compact-list-and-quote-spacing",
  "source-collapse-excess-blank-lines"
]);

const source = normalizeSourceText(`### B. パイプライン同時実行テスト

**目的**: テナント数増加時のパイプライン同時実行の安定性を確認

- **推奨テスト順**: \`100 cold → 100 warm → 200 warm → 500 warm → 500 cold-like\`

- **計測**: \`tenant start delay\`, \`pipeline update queued time\`, \`success rate\`, \`p95/p99 completion skew\`

- **Databricks 制約**: workspace あたり 1000 concurrent pipeline updates

> [!warning] Codex 指摘

> - 200/500 では「成功率」より「**起動の山がどれだけ平たくなるか** (p95 start delay)」を先に見る

> - 急増なら fan-out を 2-5 バケットに分割する設計変更候補`);

assert.match(source, /推奨テスト順.*\n- \*\*計測\*\*/);
assert.match(source, /計測.*\n- \*\*Databricks 制約\*\*/);
assert.match(source, /> \[!warning\] Codex 指摘\n> - 200\/500/);
assert.match(source, /見る\n> - 急増なら/);

const paragraphs = normalizeSourceText(`one

two`);
assert.equal(paragraphs, `one

two`);

const prefixedTable = normalizeSourceText(`## タイムテーブル・参加者| 時間 | チーム/領域 | Product参加者 | Tech参加者 |
|------|------------|--------------|-----------|
| 11:00–11:40 | Drawer | Yushiro Kato, Yosuke Shirai | Atsushi Kambara, Sho Abe, Yota Shoji, Michiaki Sakurai, Kyohei Yamaki |`);
assert.equal(
  prefixedTable,
  `## タイムテーブル・参加者

| 時間 | チーム/領域 | Product参加者 | Tech参加者 |
|------|------------|--------------|-----------|
| 11:00–11:40 | Drawer | Yushiro Kato, Yosuke Shirai | Atsushi Kambara, Sho Abe, Yota Shoji, Michiaki Sakurai, Kyohei Yamaki |`
);

const collapsedBlocks = normalizeSourceText(`# 新規環境の OIDC Bootstrap 手順## 1. 概要新規環境 (stg, prod 等) を databricks-infra-asset の CI/CD に追加する手順。### 認証フロー\`\`\`mermaid
flowchart LR
subgraph GitHub["GitHub Actions"]
JWT["OIDC JWT"]
end    subgraph Databricks["Databricks Account"]
CI_FP["ci-policy<br/>(subject_claim: repository)"]
CD_FP["dab-cd-policy<br/>(subject_claim: sub)"]
WsAPI["Workspace API"]
end    JWT -->|"CI (validate / plan)"| CI_FP
JWT -->|"CD (deploy) + environment"| CD_FP
CI_FP -.->|認証| WsAPI
CD_FP -.->|認証| WsAPI
WsAPI -.->|bundle| DAB["DAB Resources"]
\`\`\``);
assert.match(collapsedBlocks, /^# 新規環境の OIDC Bootstrap 手順\n\n## 1\. 概要/);
assert.match(collapsedBlocks, /手順。\n\n### 認証フロー\n\n```mermaid/);
assert.match(collapsedBlocks, /end\nsubgraph Databricks/);
assert.match(collapsedBlocks, /end\nJWT -->/);

const nativeMarkdown = normalizeSourceText(`# 新規環境の OIDC Bootstrap 手順

## 1. 概要

新規環境 (stg, prod 等) を databricks-infra-asset の CI/CD に追加する手順。

### 認証フロー

\`\`\`mermaid
flowchart LR
subgraph GitHub["GitHub Actions"]
JWT["OIDC JWT"]
end

subgraph Databricks["Databricks Account"]
CI_FP["ci-policy<br/>(subject_claim: repository)"]
CD_FP["dab-cd-policy<br/>(subject_claim: sub)"]
WsAPI["Workspace API"]
end

JWT -->|"CI (validate / plan)"| CI_FP
JWT -->|"CD (deploy) + environment"| CD_FP
CI_FP -.->|認証| WsAPI
CD_FP -.->|認証| WsAPI
WsAPI -.->|bundle| DAB["DAB Resources"]
\`\`\``);
assert.equal(chooseSourceText(collapsedBlocks, nativeMarkdown), nativeMarkdown);

const fenced = normalizeMarkdownBlockSpacing(`before

\`\`\`
- item

- item
> quote

> quote
\`\`\`

after`);
assert.equal(
  fenced,
  `before

\`\`\`
- item

- item
> quote

> quote
\`\`\`

after`
);

const extractedWithHorizontalRule = normalizeSourceText(
  textFromNode(
    element("div", [
      element("p", [text("aaa")]),
      element("hr"),
      element("p", [text("bbb")])
    ])
  )
);
assert.equal(extractedWithHorizontalRule, `aaa

---

bbb`);
assert.doesNotMatch(extractedWithHorizontalRule, /aaa-+bbb/);

console.log("content tests passed");
