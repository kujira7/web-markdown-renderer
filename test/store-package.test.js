const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const zipPath = path.join(rootDir, "dist", `web-markdown-renderer-${packageJson.version}.zip`);

assert.ok(fs.existsSync(zipPath), `store package not found: ${zipPath}`);

const archiveEntries = new Set(
  execFileSync("unzip", ["-Z1", zipPath], {
    cwd: rootDir,
    encoding: "utf8"
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
);

for (const requiredEntry of [
  "manifest.json",
  "background.js",
  "content.js",
  "normalization-rules.js",
  "renderer.js",
  "viewer.css",
  "vendor/marked.umd.js",
  "vendor/mermaid.min.js",
  "LICENSE"
]) {
  assert.ok(archiveEntries.has(requiredEntry), `missing store package entry: ${requiredEntry}`);
}

console.log("store package tests passed");
