const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  NORMALIZATION_RULES,
  SOURCE_NORMALIZATION_RULES,
  RENDER_NORMALIZATION_RULES,
  listNormalizationRules
} = require("../normalization-rules");

const ids = NORMALIZATION_RULES.map((rule) => rule.id);
assert.equal(ids.length, new Set(ids).size, "normalization rule IDs must be unique");

for (const rule of NORMALIZATION_RULES) {
  assert.ok(rule.id, "rule.id is required");
  assert.ok(rule.phase === "source-normalization" || rule.phase === "render-normalization", "rule.phase is invalid");
  assert.ok(rule.description, `rule.description is required for ${rule.id}`);
  assert.ok(rule.handler, `rule.handler is required for ${rule.id}`);
}

assert.deepEqual(
  listNormalizationRules("source-normalization").map((rule) => rule.id),
  SOURCE_NORMALIZATION_RULES.map((rule) => rule.id)
);
assert.deepEqual(
  listNormalizationRules("render-normalization").map((rule) => rule.id),
  RENDER_NORMALIZATION_RULES.map((rule) => rule.id)
);

for (const readmeName of ["README.md", "README.ja.md"]) {
  const readme = fs.readFileSync(path.join(__dirname, "..", readmeName), "utf8");
  for (const id of ids) {
    assert.match(readme, new RegExp("`" + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "`"));
  }
}

console.log("normalization rules tests passed");
