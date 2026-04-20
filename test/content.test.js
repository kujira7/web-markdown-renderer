const assert = require("node:assert/strict");
const { normalizeMarkdownBlockSpacing, normalizeSourceText } = require("../content");

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

console.log("content tests passed");
