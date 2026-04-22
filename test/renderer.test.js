const assert = require("node:assert/strict");
const {
  renderMarkdown,
  listNormalizationRules,
  normalizeSlackLinks,
  normalizeCollapsedPipeTables,
  normalizeSparsePipeTables,
  normalizeTableBoundaries
} = require("../renderer");

assert.deepEqual(listNormalizationRules("render-normalization").map((rule) => rule.id), [
  "render-normalize-line-endings",
  "render-convert-yaml-front-matter",
  "render-normalize-slack-links",
  "render-expand-collapsed-pipe-tables",
  "render-trim-sparse-table-spacing",
  "render-separate-table-boundaries"
]);

const slackLink = normalizeSlackLinks("See <https://example.com/docs|docs> and <https://example.com>");
assert.equal(slackLink, "See [docs](https://example.com/docs) and https://example.com");

const rendered = renderMarkdown(`# Title

See <https://example.com/docs|docs>.

- one
- \`two\`
- [x] task

~~gone~~

> quote

\`\`\`js
const x = "<unsafe>";
\`\`\`

| A | B |
|---|---|
| **x** | y |

\`\`\`mermaid
graph TD
  A["A<br/>label"] --> B
\`\`\`
`);

assert.match(rendered, /<h1>Title<\/h1>/);
assert.match(rendered, /<a href="https:\/\/example\.com\/docs"/);
assert.match(rendered, /<li>one<\/li>/);
assert.match(rendered, /<li><code>two<\/code><\/li>/);
assert.match(rendered, /type="checkbox"/);
assert.match(rendered, /<del>gone<\/del>/);
assert.match(rendered, /<blockquote>\s*<p>quote<\/p>\s*<\/blockquote>/);
assert.match(rendered, /const x = &quot;&lt;unsafe&gt;&quot;/);
assert.match(rendered, /<table>/);
assert.match(rendered, /<strong>x<\/strong>/);
assert.match(rendered, /<div class="mermaid" data-source="/);
assert.match(rendered, /A&lt;br\/&gt;label/);

const unsafe = renderMarkdown("[bad](javascript:alert(1)) <script>alert(1)</script>");
assert.match(unsafe, /href="#"/);
assert.doesNotMatch(unsafe, /<script>/);
assert.doesNotMatch(unsafe, /alert\(1\)/);

const tightTable = renderMarkdown(`**目的**: quota check
| Quota | Limit | Check |
| --- | --- | --- |
| Jobs | 12000 | API |
### Next`);
assert.match(tightTable, /<p><strong>目的<\/strong>: quota check<\/p>\s*<table>/);
assert.match(tightTable, /<\/table>\s*<h3>Next<\/h3>/);

const collapsedTable = renderMarkdown(
  "**目的**: quota check | Quota | Limit | Check | | --- | --- | --- | | Jobs | 12000 | API | | Rate | 10,000/hour | Jobs API | ### Next"
);
assert.match(collapsedTable, /<p><strong>目的<\/strong>: quota check<\/p>\s*<table>/);
assert.match(collapsedTable, /<td>Jobs<\/td>\s*<td>12000<\/td>\s*<td>API<\/td>/);
assert.match(collapsedTable, /<td>Rate<\/td>\s*<td>10,000\/hour<\/td>\s*<td>Jobs API<\/td>/);
assert.match(collapsedTable, /<\/table>\s*<h3>Next<\/h3>/);

const collapsedText = normalizeCollapsedPipeTables(
  "before | A | B | | --- | --- | | a | b | after"
);
assert.equal(collapsedText, "before\n| A | B |\n| --- | --- |\n| a | b |\nafter");

const sparseTable = renderMarkdown(`| テスト                      | 目的          | 方法                                                          |

| ------------------------ | ----------- | ----------------------------------------------------------- |

| **backlog drain**        | 停止→再開後の復帰時間 | Datastream を一時停止して backlog を溜め、再開後に平常復帰するまでの時間を計測           |

| **replay / idempotency** | 再実行時の重複有無   | Auto Loader exactly-once file processing の確認                |`);
assert.match(sparseTable, /<table>/);
assert.match(sparseTable, /<strong>backlog drain<\/strong>/);
assert.match(sparseTable, /Auto Loader exactly-once file processing/);

const sparseText = normalizeSparsePipeTables(`before

| A | B |

| --- | --- |

| a | b |

after`);
assert.equal(
  sparseText,
  `before

| A | B |
| --- | --- |
| a | b |

after`
);

const fencedTable = normalizeTableBoundaries(`before
\`\`\`
| not | table |
| --- | --- |
after
\`\`\`
done`);
assert.equal(
  fencedTable,
  `before
\`\`\`
| not | table |
| --- | --- |
after
\`\`\`
done`
);

const frontMatter = renderMarkdown(`---
name: caddi-dab-pipeline-creator
description: DAB (Databricks Asset Bundles) に新しい DLT パイプラインを追加するワークフロー。
user-invocable: true
---

# Title`);
assert.match(frontMatter, /<table>/);
assert.match(frontMatter, /<th>name<\/th>\s*<td>caddi-dab-pipeline-creator<\/td>/);
assert.match(frontMatter, /<th>description<\/th>\s*<td>DAB \(Databricks Asset Bundles\) に新しい DLT パイプラインを追加するワークフロー。<\/td>/);
assert.match(frontMatter, /<th>user-invocable<\/th>\s*<td>true<\/td>/);
assert.match(frontMatter, /<\/table>\s*<h1>Title<\/h1>/);

const foldedFrontMatter = renderMarkdown(`---
name: example
description: >
  first line
  second line
tags:
  - alpha
  - beta
---
body`);
assert.match(foldedFrontMatter, /<th>description<\/th>\s*<td>first line second line<\/td>/);
assert.match(foldedFrontMatter, /<th>tags<\/th>\s*<td>alpha<br>\s*beta<\/td>/);

const deindentedBlockFrontMatter = renderMarkdown(`---
name: tenant-provisioning-resources
description: |
tenant_provisioning スクリプト（databricks-infra-asset）が作成する全リソースのリファレンス。
---
`);
assert.match(deindentedBlockFrontMatter, /<table>/);
assert.match(deindentedBlockFrontMatter, /<th>name<\/th>\s*<td>tenant-provisioning-resources<\/td>/);
assert.match(
  deindentedBlockFrontMatter,
  /<th>description<\/th>\s*<td>tenant_provisioning スクリプト（databricks-infra-asset）が作成する全リソースのリファレンス。<\/td>/
);

const deindentedFoldedFrontMatter = renderMarkdown(`---
name: example
description: >
first line
second line
tags: alpha
---
body`);
assert.match(deindentedFoldedFrontMatter, /<th>description<\/th>\s*<td>first line second line<\/td>/);
assert.match(deindentedFoldedFrontMatter, /<th>tags<\/th>\s*<td>alpha<\/td>/);

const invalidFrontMatter = renderMarkdown(`---
name:
  nested: value
---
body`);
assert.doesNotMatch(invalidFrontMatter, /<table>\s*<tbody>\s*<tr><th>name<\/th>/);
assert.match(invalidFrontMatter, /<hr/);

console.log("renderer tests passed");
