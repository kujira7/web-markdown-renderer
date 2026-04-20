const assert = require("node:assert/strict");
const {
  renderMarkdown,
  normalizeSlackLinks,
  normalizeCollapsedPipeTables,
  normalizeSparsePipeTables,
  normalizeTableBoundaries
} = require("../renderer");

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

console.log("renderer tests passed");
